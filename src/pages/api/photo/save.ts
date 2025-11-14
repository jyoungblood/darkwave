// DW - Photo save API route

import type { APIRoute } from 'astro';
import { dwStorage } from '@/lib/dw/storage';
import { db } from '@/lib/db';
import { formatMySQLDateTime } from '@/lib/dw/helpers';
import { checkAuthorizationWithOwnership } from '@/lib/auth/permissions';
import { compressImage, isImageFile } from '@/lib/dw/images';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.userId || !locals.authRoles) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required'
      }), { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const formData = await request.formData();
    
    // Get parameters from the request
    const file = formData.get('file') as File;
    const path = (formData.get('path') as string) || '';
    const related_id = formData.get('related_id') as string;
    const related_table = formData.get('related_table') as string;
    const related_column = formData.get('related_column') as string;
    const preserveFileName = formData.get('preserveFileName') as string;
    const compressionConfigStr = formData.get('compression') as string;
    
    // Parse compression config with defaults
    let compressionConfig: { format?: string; size?: number; quality?: number } | null = null;
    if (compressionConfigStr) {
      try {
        compressionConfig = JSON.parse(compressionConfigStr);
      } catch (e) {
        console.error('Failed to parse compression config:', e);
      }
    }
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!related_id || !related_table || !related_column) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: related_id, related_table, or related_column'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authorization with ownership
    const authError = await checkAuthorizationWithOwnership(
      locals.userId,
      locals.authRoles,
      related_id,
      related_table,
      true, // Require ownership for photo updates
      db
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Compress image if compression config is provided
    let fileToUpload = file;
    let finalFileName: string | undefined = preserveFileName === 'true' ? file.name : undefined;

    // Check if file is an image (now checks both MIME type and extension)
    const isImage = isImageFile(file);

    if (compressionConfig && isImage) {
      try {
        // Use compression config values with defaults
        const format = (compressionConfig.format || 'webp') as 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif' | 'tiff' | 'gif';
        const maxWidth = compressionConfig.size || 2048;
        const quality = compressionConfig.quality || 85;
        
        const result = await compressImage(file, format, maxWidth, quality);
        
        if (result) {
          // Replace file extension with the new format
          const baseFileName = file.name.replace(/\.[^/.]+$/, '');
          finalFileName = `${baseFileName}.${result.format}`;
          
          // Create a new File object from the compressed buffer
          const mimeType = `image/${result.format}`;
          const uint8Array = new Uint8Array(result.buffer);
          const blob = new Blob([uint8Array], { type: mimeType });
          
          if (typeof File !== 'undefined') {
            fileToUpload = new File([blob], finalFileName, { type: mimeType });
          } else {
            // Fallback for older Node.js versions (shouldn't happen in modern Node.js)
            fileToUpload = file;
            finalFileName = preserveFileName === 'true' ? file.name : undefined;
          }
        }
      } catch (compressionError) {
        console.error('Error during image compression:', compressionError);
        // If compression fails, fall back to original file
      }
    }

    // Upload file to CDN with optional filename preservation
    const url = finalFileName
      ? await dwStorage.uploadFile(fileToUpload, path, finalFileName)
      : await dwStorage.uploadFile(fileToUpload, path);
      
    if (!url) {
      throw new Error('Upload failed');
    }

    // Update the database record
    const updateData: Record<string, string | null> = {
      [related_column]: url,
      [`${related_column}_parameters`]: 'aspect_ratio=4:3',
      updated_at: formatMySQLDateTime()
    };
  
    // Check if record exists
    const existingRecord = await db
      .selectFrom(related_table as any)
      .selectAll()
      .where('uuid', '=', related_id)
      .executeTakeFirst();
  
    if (!existingRecord) {
      throw new Error('Record not found');
    }
  
    // Update the record
    await db
      .updateTable(related_table as any)
      .set(updateData)
      .where('uuid', '=', related_id)
      .execute();
  
    // Fetch the updated record
    const record = await db
      .selectFrom(related_table as any)
      .selectAll()
      .where('uuid', '=', related_id)
      .executeTakeFirst();
  
    if (!record) {
      throw new Error('Failed to update record');
    }

    return new Response(JSON.stringify({ 
      success: true,
      url,
      record
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 