// DW - Bunny CDN utility

interface BunnyConfig {
  storageUrl: string;
  storageKey: string;
  storageName: string;
}



export class DWBunnyClient {
  private config: BunnyConfig;

  constructor() {
    const storageUrl = import.meta.env.BUNNY_STORAGE_URL;
    const storageKey = import.meta.env.BUNNY_STORAGE_KEY;
    const storageName = import.meta.env.BUNNY_STORAGE_NAME;

    if (!storageUrl || !storageKey || !storageName) {
      throw new Error('Missing required Bunny CDN configuration');
    }

    this.config = {
      storageUrl,
      storageKey,
      storageName
    };
  }

  async uploadFile(file: File, directory: string = ''): Promise<string | null> {
    try {
      const timestamp = new Date().getTime();
      const extension = file.name.split('.').pop();
      const safeFileName = directory 
        ? `${directory}/${timestamp}.${extension}`
        : `${timestamp}.${extension}`;
      
      const response = await fetch(`${this.config.storageUrl}/${safeFileName}`, {
        method: 'PUT',
        headers: {
          'AccessKey': this.config.storageKey,
          'Content-Type': file.type,
        },
        body: file
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return `https://${this.config.storageName}.b-cdn.net/${safeFileName}`;
    } catch (error) {
      console.error('Error uploading file to Bunny CDN:', error);
      return null;
    }
  }

  async deleteFile(cdnUrl: string): Promise<boolean> {
    try {
      // Extract the relative path from the full CDN URL
      const relativePath = cdnUrl.split('.b-cdn.net/').pop();
      if (!relativePath) {
        throw new Error('Invalid CDN URL format');
      }

      // Safety checks
      if (relativePath.endsWith('/')) {
        throw new Error('Cannot delete folders - file path must not end with "/"');
      }

      // Verify the path looks like a file (has an extension)
      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(relativePath);
      if (!hasFileExtension) {
        throw new Error('Invalid file format - path must include a file extension');
      }

      const response = await fetch(`${this.config.storageUrl}/${relativePath}`, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.config.storageKey
        }
      });

      // If the file is not found, consider it a successful deletion
      // since the end result is what we want (file doesn't exist)
      if (response.status === 404) {
        console.error(`File not found during deletion (already deleted): ${relativePath}`);
        return true;
      }

      if (!response.ok) {
        throw new Error(`Deletion failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file from Bunny CDN:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const dwBunny = new DWBunnyClient(); 







// DONT REALLY NEED THESE ANYMORE, BUT KEEPING AS AN OPTION
// SEE IMPLEMENTATION IN dw-crud


interface PhotoFieldsConfig {
  [key: string]: string | null;
}




/**
 * Handles deletion of old photo files when they are being replaced or removed
 * @param currentData Object containing the current photo URLs
 * @param newData Object containing the new photo URLs
 * @param photoFields Array of field names that contain photo URLs
 * @returns Array of any errors that occurred during deletion
 */
export async function handlePhotoUpdates(
  currentData: PhotoFieldsConfig,
  newData: PhotoFieldsConfig,
  photoFields: string[]
): Promise<string[]> {
  const deletionErrors: string[] = [];

  for (const field of photoFields) {
    const currentUrl = currentData[field];
    const newUrl = newData[field];
    
    if (currentUrl && currentUrl !== newUrl) {
      const deleteSuccess = await dwBunny.deleteFile(currentUrl);
      if (!deleteSuccess) {
        deletionErrors.push(`Failed to delete old photo for ${field}: ${currentUrl}`);
      }
    }
  }

  return deletionErrors;
}