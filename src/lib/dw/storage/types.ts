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
   * @returns Promise resolving to the file's public URL or null if upload failed
   */
  uploadFile(file: File, directory?: string): Promise<string | null>;

  /**
   * Delete a file from the storage provider
   * @param url The file's public URL (same format as returned by uploadFile)
   * @returns Promise resolving to true if delete was successful or file didn't exist
   */
  deleteFile(url: string): Promise<boolean>;
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
 * Utility functions for path manipulation
 */
export const StorageUtils = {
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
  }
};
