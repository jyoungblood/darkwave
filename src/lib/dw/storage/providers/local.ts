// DW - Local filesystem implementation of StorageProvider

import fs from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider, LocalConfig } from '../types';
import { StorageError, StorageErrorCode, StorageUtils } from '../types';

/**
 * Local filesystem implementation of StorageProvider
 * Stores files in public/media by default
 */
export class LocalProvider implements StorageProvider {
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
  async uploadFile(file: File, directory?: string): Promise<string | null> {
    try {
      const timestamp = new Date().getTime();
      const extension = file.name.split('.').pop();
      const safeFileName = StorageUtils.joinPath(
        directory || '',
        `${timestamp}.${extension}`
      );

      // Create the full directory path
      const fullDir = directory
        ? path.join(this.publicDir, directory)
        : this.publicDir;
      
      await this.ensureDir(fullDir);

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Write the file
      const fullPath = path.join(fullDir, `${timestamp}.${extension}`);
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
