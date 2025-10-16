// DW - Storage types for the storage provider

/**
 * Base interface for storage provider configuration
 */
export interface BaseConfig {
  /**
   * Base URL for serving files (e.g., "https://media.example.com")
   */
  domain: string;
}

/**
 * Configuration for Bunny CDN storage
 */
export interface BunnyConfig extends BaseConfig {
  storageUrl: string;
  storageKey: string;
  storageName: string;
}

/**
 * Configuration for S3-compatible storage (including CloudFlare R2)
 */
export interface S3Config extends BaseConfig {
  endpoint: string;
  key: string;
  secret: string;
  bucket: string;
}

/**
 * Configuration for local filesystem storage
 */
export interface LocalConfig extends BaseConfig {
  /**
   * Base directory for storing files, relative to public/
   * Default: "media"
   */
  baseDir?: string;
}

/**
 * Core interface that all storage providers must implement
 */
export interface StorageProvider {
  /**
   * Upload a file to the storage provider
   * @param file The file to upload
   * @param directory Optional subdirectory path (no leading/trailing slashes)
   * @param preserveFileName Optional filename to use instead of generating a unique one
   * @returns Promise resolving to the file's public URL or null if upload failed
   */
  uploadFile(file: File, directory?: string, preserveFileName?: string): Promise<string | null>;

  /**
   * Delete a file from the storage provider
   * @param url The file's public URL (same format as returned by uploadFile)
   * @returns Promise resolving to true if delete was successful or file didn't exist
   */
  deleteFile(url: string): Promise<boolean>;
}

/**
 * Enhanced interface for storage providers that support cleanup operations
 */
export interface EnhancedStorageProvider extends StorageProvider {
  /**
   * Find files matching a pattern (for cleanup operations)
   * @param pattern Glob pattern to match files
   * @returns Promise resolving to array of matching file paths
   */
  findFilesByPattern(pattern: string): Promise<string[]>;

  /**
   * Delete all transformed versions of an original image
   * @param originalPath The original image path
   * @returns Promise resolving to number of files deleted
   */
  deleteTransformedVersions(originalPath: string): Promise<number>;

  /**
   * Check if provider supports cleanup operations
   * @returns true if cleanup is supported, false otherwise
   */
  supportsCleanup(): boolean;

  /**
   * List all files in a specific directory
   * @param directory The directory path to list files from
   * @returns Promise resolving to array of file information objects
   */
  listFilesInDirectory(directory: string): Promise<FileInfo[]>;
}

/**
 * File information returned by listFilesInDirectory
 */
export interface FileInfo {
  /**
   * The full URL of the file
   */
  url: string;
  /**
   * The filename (without path)
   */
  name: string;
  /**
   * The file size in bytes
   */
  size: number;
  /**
   * The last modified date
   */
  lastModified: Date;
  /**
   * The MIME type of the file
   */
  mimeType?: string;
}

/**
 * Error types for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export enum StorageErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * MIME type configuration for content disposition
 */
export interface MimeTypeConfig {
  /**
   * Whether to use 'inline' disposition (true) or 'attachment' (false)
   */
  inline: boolean;
  /**
   * Optional filename suffix to append (e.g., '.download' for some file types)
   */
  filenameSuffix?: string;
}

/**
 * Storage utilities and helper functions
 */
export const StorageUtils = {
  /**
   * Get content disposition configuration for a MIME type
   */
  getMimeTypeConfig(mimeType: string): MimeTypeConfig {
    // Default to attachment disposition
    const defaultConfig: MimeTypeConfig = { inline: false };

    // Handle common MIME type patterns
    if (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('video/') ||
      mimeType === 'application/pdf'
    ) {
      return { inline: true };
    }

    // Special cases for specific MIME types
    const specialCases: Record<string, MimeTypeConfig> = {
      'text/plain': { inline: true },
      'text/html': { inline: true },
      'text/markdown': { inline: true },
      'application/json': { inline: true },
      // Add more special cases as needed
    };

    return specialCases[mimeType] || defaultConfig;
  },

  /**
   * Generate Content-Disposition header value
   */
  getContentDisposition(file: File): string {
    const config = this.getMimeTypeConfig(file.type);
    const disposition = config.inline ? 'inline' : 'attachment';
    
    // Encode the filename for the Content-Disposition header
    const encodedFilename = encodeURIComponent(file.name);
    const filenameWithSuffix = config.filenameSuffix 
      ? `${encodedFilename}${config.filenameSuffix}`
      : encodedFilename;
    
    return `${disposition}; filename="${filenameWithSuffix}"`;
  },
  /**
   * Normalize a directory path to have no leading/trailing slashes
   */
  normalizeDirectory(dir?: string): string {
    if (!dir) return '';
    return dir.replace(/^\/+|\/+$/g, '');
  },

  /**
   * Join path segments with forward slashes
   */
  joinPath(...segments: string[]): string {
    return segments
      .map(segment => this.normalizeDirectory(segment))
      .filter(Boolean)
      .join('/');
  },

  /**
   * Validate a URL is in the correct format for a provider
   */
  isValidUrl(url: string, domain: string): boolean {
    try {
      const urlObj = new URL(url);
      return url.startsWith(domain) && urlObj.pathname.length > 1;
    } catch {
      return false;
    }
  },

  /**
   * Extract the file path from a full URL
   */
  getPathFromUrl(url: string, domain: string): string | null {
    if (!this.isValidUrl(url, domain)) return null;
    return new URL(url).pathname.replace(/^\/+/, '');
  },

  /**
   * Extract the base filename from a path (without extension)
   * @param path The file path (e.g., "images/blog/photo.jpg")
   * @returns The base filename without extension (e.g., "photo")
   */
  getBaseFilename(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.split('.')[0];
  },

  /**
   * Generate a pattern to find transformed versions of an image
   * @param originalPath The original image path
   * @returns Pattern string for finding transformed versions
   */
  getTransformedPattern(originalPath: string): string {
    const baseFilename = this.getBaseFilename(originalPath);
    return `transformed/**/${baseFilename}_*`;
  },

  /**
   * Check if a path is a transformed image path
   * @param path The file path to check
   * @returns true if it's a transformed image path
   */
  isTransformedPath(path: string): boolean {
    return path.startsWith('transformed/') || path.includes('/transformed/');
  },

  /**
   * Sanitize a filename for safe storage while preserving most original characters
   * @param filename The original filename to sanitize
   * @returns Sanitized filename safe for storage
   */
  sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    filename = filename.replace(/\.\.\/|\.\//g, '');
    
    // Remove null bytes and control characters
    filename = filename.replace(/[\x00-\x1f\x7f]/g, '');
    
    // Remove leading/trailing dots and spaces (some systems don't like these)
    filename = filename.replace(/^[.\s]+|[.\s]+$/g, '');
    
    return filename;
  },

  /**
   * Generate a unique filename if the original already exists
   * @param filename The original filename
   * @param extension The file extension
   * @returns Unique filename with timestamp suffix if needed
   */
  generateUniqueFilename(filename: string, extension: string): string {
    const baseName = filename.replace(`.${extension}`, '');
    const timestamp = new Date().getTime();
    return `${baseName}_${timestamp}.${extension}`;
  }
};
