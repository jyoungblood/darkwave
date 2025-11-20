// DW - Gallery create API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { dwStorage } from '@/lib/dw/storage';
import { v4 as uuidv4 } from 'uuid';
import { checkAuthorizationWithOwnership, parseRelatedId } from '@/lib/auth/permissions';
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
    
    // Get all files from the array
    const files: File[] = [];
    const fileKeys = [...formData.keys()].filter(key => key.startsWith('file'));
    
    // Sort keys to ensure files are processed in order
    fileKeys.sort((a, b) => {
      const aIndex = parseInt(a.match(/\[(\d+)\]/)?.[1] || '0');
      const bIndex = parseInt(b.match(/\[(\d+)\]/)?.[1] || '0');
      return aIndex - bIndex;
    });

    // Add files in order
    for (const key of fileKeys) {
      const file = formData.get(key) as File;
      if (file) files.push(file);
    }

    const path = (formData.get('path') as string) || '';
    const related_id_raw = (formData.get('related_id') as string) || '';
    const related_table = (formData.get('related_table') as string) || '';
    const gallery_type = (formData.get('gallery_type') as string) || '';
    const parameters_column_raw = (formData.get('parameters_column') as string) || '';
    const parameters_column_default = (formData.get('parameters_column_default') as string) || 'aspect_ratio=4:3';
    const preserveFileName = (formData.get('preserveFileName') as string) || 'false';
    const compressionConfigStr = formData.get('compression') as string;
    
    // Parse related_id to get column and value
    const { column: idColumn, value: related_id } = parseRelatedId(related_id_raw);
    
    // Parse parameters_column JSON object to extract name
    let parameters_column = '';
    if (parameters_column_raw) {
      try {
        const parsed = JSON.parse(parameters_column_raw);
        if (typeof parsed === 'object' && parsed !== null && parsed.name) {
          parameters_column = parsed.name;
        }
      } catch {
        // Invalid JSON, leave empty
      }
    }
    
    // Parse compression config with defaults
    let compressionConfig: { format?: string; size?: number; quality?: number } | null = null;
    if (compressionConfigStr) {
      try {
        compressionConfig = JSON.parse(compressionConfigStr);
      } catch (e) {
        console.error('Failed to parse compression config:', e);
      }
    }
    
    if (files.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No files provided'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!related_id || !related_table || !gallery_type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: related_id, related_table, or gallery_type'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check authorization with ownership
    const authError = await checkAuthorizationWithOwnership(
      locals.userId,
      locals.authRoles,
      related_id,
      related_table,
      true, // Require ownership for gallery creation
      db,
      idColumn
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upload all files sequentially to ensure reliability
    const uploadResults = [];
    const errors = [];
    
    for (const file of files) {
      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`Invalid file type: ${file.type}`);
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // Compress image if compression config is provided
        let fileToUpload = file;
        let finalFileName: string | undefined = preserveFileName === 'true' ? file.name : undefined;

        if (compressionConfig && isImageFile(file)) {
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
            fileToUpload = new File([blob], finalFileName, { type: mimeType });
          }
          // If compression fails, fall back to original file
        }

        // Upload file with optional filename preservation
        const url = finalFileName
          ? await dwStorage.uploadFile(fileToUpload, path, finalFileName)
          : await dwStorage.uploadFile(fileToUpload, path);
        
        if (!url) {
          throw new Error(`Upload failed for file: ${file.name}`);
        }

        // Get current display order
        const existingPhotos = await db
          .selectFrom('gallery_content')
          .select('display_order')
          .where('related_id', '=', related_id)
          .where('related_table', '=', related_table)
          .where('gallery_type', '=', gallery_type)
          .orderBy('display_order', 'desc')
          .limit(1)
          .execute();

        // If there are existing photos, increment from the highest order
        // If no photos exist, start at 0
        const nextDisplayOrder = existingPhotos.length > 0 
          ? (existingPhotos[0].display_order ?? 0) + 1 
          : 0;

        // Insert into database
        const insertData: Record<string, any> = {
          uuid: uuidv4(),
          photo_url: url,
          gallery_type,
          display_order: nextDisplayOrder,
          related_id,
          related_table,
          // title: file.name.split('.')[0], // Use filename without extension as title
          // description: null,
          user_id: locals.userId
        };
        
        // Add parameters column - use configured column or default to 'photo_url_parameters'
        const finalParametersColumn = parameters_column || 'photo_url_parameters';
        insertData[finalParametersColumn] = parameters_column_default;
        
        await db
          .insertInto('gallery_content')
          .values(insertData as any)
          .execute();

        // Fetch the inserted record
        const photo = await db
          .selectFrom('gallery_content')
          .selectAll()
          .where('photo_url', '=', url)
          .executeTakeFirst();

        if (!photo) {
          throw new Error('Failed to insert photo record');
        }

        uploadResults.push({
          url,
          uuid: photo.uuid,
          filename: file.name, // Use original filename for display
          name: file.name,
          size: file.size,
          type: file.type,
          display_order: photo.display_order
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue with next file instead of failing completely
        continue;
      }
    }

    // Return success with all uploaded file URLs and any errors
    return new Response(JSON.stringify({ 
      results: uploadResults,
      success: true,
      files: uploadResults,
      total: files.length,
      processed: uploadResults.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
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