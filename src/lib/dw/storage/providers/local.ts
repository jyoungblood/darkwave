// DW - Local filesystem implementation of StorageProvider

import fs from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider, LocalConfig, EnhancedStorageProvider, FileInfo } from '../types';
import { StorageError, StorageErrorCode, StorageUtils } from '../types';

/**
 * Local filesystem implementation of StorageProvider
 * Stores files in public/media by default
 */
export class LocalProvider implements StorageProvider, EnhancedStorageProvider {
  private readonly baseDir: string;
  private readonly publicDir: string;

  constructor(private readonly config: LocalConfig) {
    this.validateConfig();
    this.baseDir = this.config.baseDir || 'media';
    // Ensure baseDir is relative to public/
    this.publicDir = path.join(process.cwd(), 'public', this.baseDir);
  }

  /**
   * Validate the configuration
   * @throws StorageError if config is invalid
   */
  private validateConfig(): void {
    if (!this.config.domain) {
      throw new StorageError(
        'Missing required domain configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }

    try {
      new URL(this.config.domain);
    } catch {
      throw new StorageError(
        'Invalid domain URL in configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }

    // Validate baseDir if provided
    if (this.config.baseDir) {
      if (this.config.baseDir.includes('..') || path.isAbsolute(this.config.baseDir)) {
        throw new StorageError(
          'Base directory must be a relative path without parent directory references',
          StorageErrorCode.INVALID_CONFIG
        );
      }
    }
  }

  /**
   * Ensure the target directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Upload a file to the local filesystem
   */
  async uploadFile(file: File, directory?: string, preserveFileName?: string): Promise<string | null> {
    try {
      let safeFileName: string;
      let actualFileName: string;
      
      if (preserveFileName) {
        // Use the preserved filename with sanitization
        const sanitizedFilename = StorageUtils.sanitizeFilename(preserveFileName);
        const extension = file.name.split('.').pop();
        
        // Check if we need to add extension
        const hasExtension = sanitizedFilename.includes('.');
        if (!hasExtension && extension) {
          safeFileName = StorageUtils.joinPath(
            directory || '',
            `${sanitizedFilename}.${extension}`
          );
          actualFileName = `${sanitizedFilename}.${extension}`;
        } else {
          safeFileName = StorageUtils.joinPath(
            directory || '',
            sanitizedFilename
          );
          actualFileName = sanitizedFilename;
        }
      } else {
        // Use existing timestamp-based naming
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        safeFileName = StorageUtils.joinPath(
          directory || '',
          `${timestamp}.${extension}`
        );
        actualFileName = `${timestamp}.${extension}`;
      }

      // Create the full directory path
      const fullDir = directory
        ? path.join(this.publicDir, directory)
        : this.publicDir;
      
      await this.ensureDir(fullDir);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Write the file exactly as is
      const fullPath = path.join(fullDir, actualFileName);
      await fs.writeFile(fullPath, buffer);

      // Return the public URL
      return `${this.config.domain}/${this.baseDir}/${safeFileName}`;
    } catch (error) {
      console.error('Error uploading file to local filesystem:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Delete a file from the local filesystem
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      const relativePath = StorageUtils.getPathFromUrl(url, this.config.domain);
      if (!relativePath) {
        throw new StorageError(
          'Invalid URL format',
          StorageErrorCode.INVALID_URL
        );
      }

      // Remove the baseDir prefix from the path if it exists
      const normalizedPath = relativePath.startsWith(this.baseDir)
        ? relativePath.slice(this.baseDir.length + 1)
        : relativePath;

      // Safety checks
      if (normalizedPath.endsWith('/')) {
        throw new StorageError(
          'Cannot delete folders - file path must not end with "/"',
          StorageErrorCode.INVALID_URL
        );
      }

      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(normalizedPath);
      if (!hasFileExtension) {
        throw new StorageError(
          'Invalid file format - path must include a file extension',
          StorageErrorCode.INVALID_URL
        );
      }

      // Ensure the path doesn't try to escape the media directory
      const fullPath = path.join(this.publicDir, normalizedPath);
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(this.publicDir)) {
        throw new StorageError(
          'Invalid file path - attempted directory traversal',
          StorageErrorCode.INVALID_URL
        );
      }

      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Error deleting file from local filesystem:', error);
      // If file doesn't exist, consider it a successful deletion
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.warn(`File not found during deletion (already deleted): ${url}`);
        return true;
      }
      if (error instanceof StorageError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Find files matching a pattern (for cleanup operations)
   * @param pattern Glob pattern to match files
   * @returns Promise resolving to array of matching file paths
   */
  async findFilesByPattern(pattern: string): Promise<string[]> {
    try {
      // Convert glob pattern to directory and filename pattern
      const parts = pattern.split('/');
      const searchDir = parts[0]; // e.g., "transformed"
      const filenamePattern = parts[parts.length - 1]; // e.g., "*filename*"
      
      const searchPath = path.join(this.publicDir, searchDir);
      
      // Check if the search directory exists
      try {
        await fs.access(searchPath);
      } catch {
        return []; // Directory doesn't exist, no files to find
      }

      const matchingFiles: string[] = [];
      
      // Recursively search for matching files
      await this.searchDirectory(searchPath, filenamePattern, matchingFiles, searchDir);
      
      return matchingFiles;
    } catch (error) {
      console.error('Error finding files by pattern:', error);
      return [];
    }
  }

  /**
   * Recursively search a directory for files matching a pattern
   */
  private async searchDirectory(
    dirPath: string, 
    filenamePattern: string, 
    matchingFiles: string[], 
    relativePath: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          await this.searchDirectory(fullPath, filenamePattern, matchingFiles, entryRelativePath);
        } else if (entry.isFile()) {
          // Check if filename matches the pattern
          if (this.matchesPattern(entry.name, filenamePattern)) {
            matchingFiles.push(entryRelativePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory: ${dirPath}`, error);
    }
  }

  /**
   * List all files in a specific directory
   * @param directory The directory path to list files from
   * @returns Promise resolving to array of file information objects
   */
  async listFilesInDirectory(directory: string): Promise<FileInfo[]> {
    try {
      const normalizedDir = StorageUtils.normalizeDirectory(directory);
      const fullDirPath = path.join(this.publicDir, normalizedDir);
      
      // Check if directory exists
      try {
        await fs.access(fullDirPath);
      } catch {
        return []; // Directory doesn't exist
      }

      const files: FileInfo[] = [];
      const entries = await fs.readdir(fullDirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = path.join(fullDirPath, entry.name);
          const relativePath = path.join(normalizedDir, entry.name);
          const url = `${this.config.domain}/${relativePath.replace(/\\/g, '/')}`;
          
          try {
            const stats = await fs.stat(fullPath);
            files.push({
              url,
              name: entry.name,
              size: stats.size,
              lastModified: stats.mtime,
              mimeType: this.getMimeTypeFromFilename(entry.name)
            });
          } catch (error) {
            console.error(`Error getting stats for file ${entry.name}:`, error);
          }
        }
      }

      return files;
    } catch (error) {
      console.error('Error listing files in directory:', error);
      return [];
    }
  }

  /**
   * Get MIME type from filename extension
   * @param filename The filename to get MIME type for
   * @returns MIME type string or undefined
   */
  private getMimeTypeFromFilename(filename: string): string | undefined {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
    };
    return mimeTypes[extension || ''];
  }

  /**
   * Check if a filename matches a pattern
   * @param filename The filename to check
   * @param pattern The filename pattern
   * @returns true if the filename matches the pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '.*')  // Convert * to .*
      .replace(/\?/g, '.');  // Convert ? to .
    
    const regex = new RegExp(regexPattern);
    return regex.test(filename);
  }

  /**
   * Delete all transformed versions of an original image
   * @param originalPath The original image path
   * @returns Promise resolving to number of files deleted
   */
  async deleteTransformedVersions(originalPath: string): Promise<number> {
    try {
      const baseFilename = StorageUtils.getBaseFilename(originalPath);
      const pattern = StorageUtils.getTransformedPattern(originalPath);
      
      // console.log(`🧹 Cleaning up transformed versions for: ${originalPath}`);
      // console.log(`🔍 Searching pattern: ${pattern}`);
      
      const matchingFiles = await this.findFilesByPattern(pattern);
      
      if (matchingFiles.length === 0) {
        // console.log(`✨ No transformed versions found for: ${originalPath}`);
        return 0;
      }

      // console.log(`🗑️  Found ${matchingFiles.length} transformed versions to delete`);
      
      let deletedCount = 0;
      for (const filePath of matchingFiles) {
        try {
          const fullPath = path.join(this.publicDir, filePath);
          await fs.unlink(fullPath);
          deletedCount++;
          // console.log(`✅ Deleted: ${filePath}`);
        } catch (error) {
          console.error(`❌ Failed to delete: ${filePath}`, error);
        }
      }

      // console.log(`🎉 Cleanup complete: ${deletedCount}/${matchingFiles.length} files deleted`);
      return deletedCount;
    } catch (error) {
      console.error('Error during transformed version cleanup:', error);
      return 0;
    }
  }

  /**
   * Check if provider supports cleanup operations
   * @returns true if cleanup is supported, false otherwise
   */
  supportsCleanup(): boolean {
    return true; // Local filesystem supports full cleanup operations
  }
}

/**
 * Create a new LocalProvider instance from environment variables
 */
export function createLocalProvider(): LocalProvider | null {
  const domain = import.meta.env.SITE_DOMAIN;
  if (!domain) {
    return null;
  }

  return new LocalProvider({
    domain: domain.startsWith('http') ? domain : `https://${domain}`,
    baseDir: 'media'
  });
}
