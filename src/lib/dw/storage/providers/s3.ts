// DW - S3-compatible storage provider (works with CloudFlare R2)

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { StorageProvider, S3Config, EnhancedStorageProvider } from '../types';
import { StorageError, StorageErrorCode, StorageUtils } from '../types';

/**
 * S3-compatible storage provider (works with CloudFlare R2)
 */
export class S3Provider implements StorageProvider, EnhancedStorageProvider {
  private client: S3Client;

  constructor(private readonly config: S3Config) {
    this.validateConfig();
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: 'auto', // CloudFlare R2 uses 'auto'
      credentials: {
        accessKeyId: this.config.key,
        secretAccessKey: this.config.secret,
      },
    });
  }

  /**
   * Validate the configuration
   * @throws StorageError if config is invalid
   */
  private validateConfig(): void {
    const { endpoint, domain, key, secret, bucket } = this.config;
    
    if (!endpoint || !domain || !key || !secret || !bucket) {
      throw new StorageError(
        'Missing required S3 configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }

    try {
      new URL(endpoint);
      new URL(domain);
    } catch {
      throw new StorageError(
        'Invalid URL in S3 configuration',
        StorageErrorCode.INVALID_CONFIG
      );
    }
  }

  /**
   * Upload a file to S3-compatible storage
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

      // Convert File to Buffer for AWS SDK
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucket,
          Key: safeFileName,
          Body: buffer,
          ContentType: file.type,
          // Set Content-Disposition using our MIME type system
          ContentDisposition: StorageUtils.getContentDisposition(file),
          // Ensure files are publicly readable
          ACL: 'public-read',
        },
      });

      await upload.done();

      // Return the public URL using the configured domain
      return `${this.config.domain}/${safeFileName}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Delete a file from S3-compatible storage
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      const relativePath = StorageUtils.getPathFromUrl(url, this.config.domain);
      if (!relativePath) {
        throw new StorageError(
          'Invalid S3 URL format',
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

      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(relativePath);
      if (!hasFileExtension) {
        throw new StorageError(
          'Invalid file format - path must include a file extension',
          StorageErrorCode.INVALID_URL
        );
      }

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: relativePath,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // AWS SDK throws NoSuchKey error when file doesn't exist
      // Consider this a successful deletion since the end result is what we want
      if (error instanceof Error && error.name === 'NoSuchKey') {
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
      // Convert glob pattern to S3 prefix and delimiter
      // Pattern: "transformed/**/*filename*" -> prefix: "transformed/", delimiter: "/"
      const parts = pattern.split('/');
      const prefix = parts[0] + '/';
      const filenamePattern = parts[parts.length - 1]; // Last part is the filename pattern
      
      const matchingFiles: string[] = [];
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000, // AWS max
        });

        const response = await this.client.send(command);
        
        if (response.Contents) {
          for (const object of response.Contents) {
            if (object.Key) {
              // Check if the key matches our filename pattern
              if (this.matchesPattern(object.Key, filenamePattern)) {
                matchingFiles.push(object.Key);
              }
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return matchingFiles;
    } catch (error) {
      console.error('Error finding files by pattern:', error);
      return [];
    }
  }

  /**
   * Check if a key matches a filename pattern
   * @param key The S3 object key
   * @param pattern The filename pattern
   * @returns true if the key matches the pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '.*')  // Convert * to .*
      .replace(/\?/g, '.');  // Convert ? to .
    
    const regex = new RegExp(regexPattern);
    const filename = key.split('/').pop() || '';
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
          const command = new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: filePath,
          });
          
          await this.client.send(command);
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
    return true; // S3/R2 supports full cleanup operations
  }
}

/**
 * Create a new S3Provider instance from environment variables
 */
export function createS3Provider(): S3Provider | null {
  const endpoint = import.meta.env.S3_ENDPOINT;
  const domain = import.meta.env.S3_DOMAIN;
  const key = import.meta.env.S3_KEY;
  const secret = import.meta.env.S3_SECRET;
  const bucket = import.meta.env.S3_BUCKET;

  if (!endpoint || !domain || !key || !secret || !bucket) {
    return null;
  }

  return new S3Provider({
    endpoint,
    domain,
    key,
    secret,
    bucket,
  });
}
