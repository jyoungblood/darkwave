// DW - Photo save API route

import type { APIRoute } from 'astro';
import { dwBunny } from '@/lib/dw/bunny';
import { db } from '@/lib/db';
import { formatMySQLDateTime } from '@/lib/dw/helpers';
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
    
    // Get parameters from the request
    const file = formData.get('file') as File;
    const path = (formData.get('path') as string) || '';
    const related_id = formData.get('related_id') as string;
    const related_table = formData.get('related_table') as string;
    const related_column = formData.get('related_column') as string;
    
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

    // Upload file to CDN
    const url = await dwBunny.uploadFile(file, path);
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