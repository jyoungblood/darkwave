// DW - Storage factory for selecting and initializing the appropriate storage provider

import type { StorageProvider } from './types';
import { StorageError, StorageErrorCode } from './types';
import { BunnyProvider, createBunnyProvider } from './providers/bunny';
import { S3Provider, createS3Provider } from './providers/s3';
import { LocalProvider, createLocalProvider } from './providers/local';

/**
 * Storage factory that selects and initializes the appropriate storage provider
 */
class StorageFactory {
  private static instance: StorageFactory;
  private provider: StorageProvider | null = null;
  private providerType: 'bunny' | 's3' | 'local' | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of StorageFactory
   */
  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  /**
   * Initialize the storage provider if not already initialized
   * @throws StorageError if no valid provider can be initialized
   */
  private async initializeProvider(): Promise<void> {
    if (this.provider) return;

    // Try Bunny CDN first
    const bunnyProvider = createBunnyProvider();
    if (bunnyProvider) {
      this.provider = bunnyProvider;
      this.providerType = 'bunny';
      return;
    }

    // Try S3/R2 next
    const s3Provider = createS3Provider();
    if (s3Provider) {
      this.provider = s3Provider;
      this.providerType = 's3';
      return;
    }

    // Finally, try local storage
    const localProvider = createLocalProvider();
    if (localProvider) {
      this.provider = localProvider;
      this.providerType = 'local';
      return;
    }

    throw new StorageError(
      'No valid storage provider could be initialized. Check environment variables.',
      StorageErrorCode.INVALID_CONFIG
    );
  }

  /**
   * Get the current provider type
   */
  public getProviderType(): 'bunny' | 's3' | 'local' | null {
    return this.providerType;
  }

  /**
   * Upload a file using the configured storage provider
   * @param file The file to upload
   * @param directory Optional subdirectory path (no leading/trailing slashes)
   * @returns Promise resolving to the file's public URL or null if upload failed
   */
  public async uploadFile(file: File, directory?: string): Promise<string | null> {
    await this.initializeProvider();
    if (!this.provider) {
      throw new StorageError(
        'No storage provider available',
        StorageErrorCode.INVALID_CONFIG
      );
    }
    return this.provider.uploadFile(file, directory);
  }

  /**
   * Delete a file using the configured storage provider
   * @param url The file's public URL
   * @returns Promise resolving to true if delete was successful
   */
  public async deleteFile(url: string): Promise<boolean> {
    await this.initializeProvider();
    if (!this.provider) {
      throw new StorageError(
        'No storage provider available',
        StorageErrorCode.INVALID_CONFIG
      );
    }
    return this.provider.deleteFile(url);
  }
}

// Export a singleton instance
export const dwStorage = StorageFactory.getInstance();

// For backward compatibility with existing code
export const dwBunny = {
  uploadFile: (file: File, directory?: string) => dwStorage.uploadFile(file, directory),
  deleteFile: (url: string) => dwStorage.deleteFile(url),
};

// Re-export types and errors for convenience
export type { StorageProvider };
export { StorageError, StorageErrorCode };
