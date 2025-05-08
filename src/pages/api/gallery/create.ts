// DW - Gallery create API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { dwBunny } from '@/lib/dw-bunny';
import { v4 as uuidv4 } from 'uuid';
import { checkAuthorizationWithOwnership } from '@/lib/auth/permissions';

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
    const related_id = formData.get('related_id') as string;
    const related_table = formData.get('related_table') as string;
    const gallery_type = formData.get('gallery_type') as string;
    
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
      db
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

        const timestamp = new Date().getTime() + Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${timestamp}.${extension}`;
        
        const url = await dwBunny.uploadFile(file, path);
        
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
        await db
          .insertInto('gallery_content')
          .values({
            uuid: uuidv4(),
            photo_url: url,
            photo_url_parameters: 'aspect_ratio=4:3',
            gallery_type,
            display_order: nextDisplayOrder,
            related_id,
            related_table,
            // title: file.name.split('.')[0], // Use filename without extension as title
            // description: null,
            user_id: locals.userId
          } as any)
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
          filename,
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