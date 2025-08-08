// DW - S3-compatible storage provider (works with CloudFlare R2)

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { StorageProvider, S3Config } from '../types';
import { StorageError, StorageErrorCode, StorageUtils } from '../types';

/**
 * S3-compatible storage provider (works with CloudFlare R2)
 */
export class S3Provider implements StorageProvider {
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
  async uploadFile(file: File, directory?: string): Promise<string | null> {
    try {
      const timestamp = new Date().getTime();
      const extension = file.name.split('.').pop();
      const safeFileName = StorageUtils.joinPath(
        directory || '',
        `${timestamp}.${extension}`
      );

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
