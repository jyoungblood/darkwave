// DW - Bunny CDN implementation of StorageProvider

import type { StorageProvider, BunnyConfig, EnhancedStorageProvider } from '../types';
import { StorageError, StorageErrorCode, StorageUtils } from '../types';

/**
 * Bunny CDN implementation of StorageProvider
 */
export class BunnyProvider implements StorageProvider, EnhancedStorageProvider {
  constructor(private readonly config: BunnyConfig) {
    this.validateConfig();
  }

  /**
   * Validate the configuration
   * @throws StorageError if config is invalid
   */
  private validateConfig(): void {
    if (!this.config.storageUrl || !this.config.storageKey || !this.config.storageName) {
      throw new StorageError(
        'Missing required Bunny CDN configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }

    try {
      new URL(this.config.storageUrl);
      new URL(this.config.domain);
    } catch {
      throw new StorageError(
        'Invalid URL in Bunny CDN configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }
  }

  /**
   * Upload a file to Bunny CDN storage
   */
  async uploadFile(file: File, directory?: string, preserveFileName?: string): Promise<string | null> {
    try {
      let safeFileName: string;
      
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
        } else {
          safeFileName = StorageUtils.joinPath(
            directory || '',
            sanitizedFilename
          );
        }
      } else {
        // Use existing timestamp-based naming
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        safeFileName = StorageUtils.joinPath(
          directory || '',
          `${timestamp}.${extension}`
        );
      }
      
      const response = await fetch(`${this.config.storageUrl}/${safeFileName}`, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.storageKey,
          'Content-Type': file.type,
          'Content-Disposition': StorageUtils.getContentDisposition(file),
        },
        body: file
      });

      if (!response.ok) {
        throw new StorageError(
          `Upload failed: ${response.statusText}`,
          StorageErrorCode.UPLOAD_FAILED
        );
      }

      return `https://${this.config.storageName}.b-cdn.net/${safeFileName}`;
    } catch (error) {
      console.error('Error uploading file to Bunny CDN:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Delete a file from Bunny CDN storage
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract the relative path from the full CDN URL
      const relativePath = StorageUtils.getPathFromUrl(url, `https://${this.config.storageName}.b-cdn.net`);
      if (!relativePath) {
        throw new StorageError(
          'Invalid CDN URL format',
          StorageErrorCode.INVALID_URL
        );
      }

      // Safety checks
      if (relativePath.endsWith('/')) {
        throw new StorageError(
          'Cannot delete folders - file path must not end with "/"',
          StorageErrorCode.INVALID_URL
        );
      }

      // Verify the path looks like a file (has an extension)
      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(relativePath);
      if (!hasFileExtension) {
        throw new StorageError(
          'Invalid file format - path must include a file extension',
          StorageErrorCode.INVALID_URL
        );
      }

      const response = await fetch(`${this.config.storageUrl}/${relativePath}`, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.storageKey
        }
      });

      // If the file is not found, consider it a successful deletion
      if (response.status === 404) {
        console.warn(`File not found during deletion (already deleted): ${relativePath}`);
        return true;
      }

      if (!response.ok) {
        throw new StorageError(
          `Deletion failed: ${response.statusText}`,
          StorageErrorCode.DELETE_FAILED
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting file from Bunny CDN:', error);
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
    // Bunny CDN doesn't support listing files by pattern
    // This is a limitation of their API
    console.warn('Bunny CDN does not support file pattern matching for cleanup');
    return [];
  }

  /**
   * Delete all transformed versions of an original image
   * @param originalPath The original image path
   * @returns Promise resolving to number of files deleted
   */
  async deleteTransformedVersions(originalPath: string): Promise<number> {
    // Bunny CDN doesn't support automatic cleanup of transformed versions
    // Users would need to manually track and delete transformed files
    console.warn('Bunny CDN does not support automatic cleanup of transformed versions');
    return 0;
  }

  /**
   * Check if provider supports cleanup operations
   * @returns true if cleanup is supported, false otherwise
   */
  supportsCleanup(): boolean {
    return false; // Bunny CDN doesn't support cleanup operations
  }
}

/**
 * Create a new BunnyProvider instance from environment variables
 */
export function createBunnyProvider(): BunnyProvider | null {
  const storageUrl = import.meta.env.BUNNY_STORAGE_URL;
  const storageKey = import.meta.env.BUNNY_STORAGE_KEY;
  const storageName = import.meta.env.BUNNY_STORAGE_NAME;

  if (!storageUrl || !storageKey || !storageName) {
    return null;
  }

  return new BunnyProvider({
    storageUrl,
    storageKey,
    storageName,
    domain: `https://${storageName}.b-cdn.net`
  });
}
