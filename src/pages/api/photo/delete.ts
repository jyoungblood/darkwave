// DW - Photo delete API route

import type { APIRoute } from 'astro';
import { dwBunny } from '@/lib/dw-bunny';
import { db } from '@/lib/db';
import { formatMySQLDateTime } from '@/lib/dw';
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

    // Get parameters from the request
    const { photo_url, related_id, related_table, related_column } = await request.json();
    
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
      true, // Require ownership for photo deletion
      db
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from CDN if photo_url is provided
    if (photo_url) {
      try {
        await dwBunny.deleteFile(photo_url);
      } catch (error) {
        console.error('Error deleting file from CDN:', error);
        // Continue with database update even if CDN deletion fails
      }
    }

    // Update the database record
    const updateData: Record<string, string | null> = {
      [related_column]: null,
      [`${related_column}_parameters`]: null,
      updated_at: formatMySQLDateTime()
    };
  
    // Check if record exists
    const existingRecord = await db
      .selectFrom(related_table as any)
      .selectAll()
      .where('uuid', '=', related_id)
      .executeTakeFirst();
  
    if (!existingRecord) {
      return new Response(JSON.stringify({ error: 'Record not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
      record
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Delete failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 