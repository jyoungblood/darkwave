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
   * Get the current provider's domain for URL construction
   */
  public async getProviderDomain(): Promise<string | null> {
    await this.initializeProvider();
    if (!this.provider) {
      return null;
    }

    // Access the provider's config to get the domain
    const provider = this.provider as any;
    return provider.config?.domain || null;
  }

  /**
   * Upload a file using the configured storage provider
   * @param file The file to upload
   * @param directory Optional subdirectory path (no leading/trailing slashes)
   * @param preserveFileName Optional filename to use instead of generating a unique one
   * @returns Promise resolving to the file's public URL or null if upload failed
   */
  public async uploadFile(file: File, directory?: string, preserveFileName?: string): Promise<string | null> {
    await this.initializeProvider();
    if (!this.provider) {
      throw new StorageError(
        'No storage provider available',
        StorageErrorCode.INVALID_CONFIG
      );
    }
    return this.provider.uploadFile(file, directory, preserveFileName);
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

  /**
   * Delete all transformed versions of an original image
   * @param originalPath The original image path (e.g., "images/blog/photo.jpg")
   * @returns Promise resolving to number of files deleted, or null if cleanup not supported
   */
  public async deleteTransformedVersions(originalPath: string): Promise<number | null> {
    await this.initializeProvider();
    if (!this.provider) {
      throw new StorageError(
        'No storage provider available',
        StorageErrorCode.INVALID_CONFIG
      );
    }

    // Check if provider supports cleanup
    const enhancedProvider = this.provider as any;
    if (!enhancedProvider.supportsCleanup || !enhancedProvider.supportsCleanup()) {
      return null; // Cleanup not supported by this provider
    }

    return enhancedProvider.deleteTransformedVersions(originalPath);
  }

  /**
   * Check if the current provider supports cleanup operations
   * @returns true if cleanup is supported, false otherwise
   */
  public async supportsCleanup(): Promise<boolean> {
    await this.initializeProvider();
    if (!this.provider) {
      return false;
    }

    const enhancedProvider = this.provider as any;
    return enhancedProvider.supportsCleanup ? enhancedProvider.supportsCleanup() : false;
  }
}

// Export a singleton instance
export const dwStorage = StorageFactory.getInstance();

// For backward compatibility with existing code
export const dwBunny = {
  uploadFile: (file: File, directory?: string, preserveFileName?: string) => dwStorage.uploadFile(file, directory, preserveFileName),
  deleteFile: (url: string) => dwStorage.deleteFile(url),
};

// Re-export types and errors for convenience
export type { StorageProvider };
export { StorageError, StorageErrorCode };
