// DW - Gallery save API route

import type { APIRoute } from 'astro';
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

    // Get the photo data from the request
    const { 
      photo_uuid, 
      photo_title, 
      photo_description, 
      photo_url_parameters,
      related_id,
      related_table
    } = await request.json();
    
    if (!photo_uuid) {
      return new Response(JSON.stringify({ 
        error: 'Photo UUID is required'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if record exists
    const existingRecord = await db
      .selectFrom('gallery_content')
      .selectAll()
      .where('uuid', '=', photo_uuid)
      .executeTakeFirst();

    if (!existingRecord) {
      return new Response(JSON.stringify({ 
        error: 'Record not found'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check authorization with ownership
    const authError = await checkAuthorizationWithOwnership(
      locals.userId,
      locals.authRoles,
      related_id || existingRecord.related_id,
      related_table || existingRecord.related_table,
      true, // Require ownership for gallery updates
      db
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the record
    const updateData: Record<string, string | null> = {
      title: photo_title || null,
      description: photo_description || null,
      photo_url_parameters: photo_url_parameters || null,
      updated_at: formatMySQLDateTime()
    };

    await db
      .updateTable('gallery_content')
      .set(updateData)
      .where('uuid', '=', photo_uuid)
      .execute();

    // Fetch the updated record
    const photo = await db
      .selectFrom('gallery_content')
      .selectAll()
      .where('uuid', '=', photo_uuid)
      .executeTakeFirst();

    if (!photo) {
      throw new Error('Failed to update record');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Photo details saved successfully',
      photo
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error saving photo details:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save photo details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 