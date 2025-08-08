// DW - Gallery delete API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { dwStorage } from '@/lib/dw/storage';
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

    // Get the photo UUID and related data from the request
    const { photo_uuid, related_id, related_table } = await request.json();
    
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

    // Get the photo from the database first
    const photo = await db
      .selectFrom('gallery_content')
      .select(['photo_url', 'related_id', 'related_table'])
      .where('uuid', '=', photo_uuid)
      .executeTakeFirst();

    if (!photo) {
      return new Response(JSON.stringify({ 
        error: 'Photo not found'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Use provided related_id/table or fall back to values from the database
    const effectiveRelatedId = related_id || photo.related_id;
    const effectiveRelatedTable = related_table || photo.related_table;

    if (!effectiveRelatedId || !effectiveRelatedTable) {
      return new Response(JSON.stringify({ 
        error: 'Missing related entity information'
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
      effectiveRelatedId,
      effectiveRelatedTable,
      true, // Require ownership for photo deletion
      db
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the file from CDN
    const deleteSuccess = photo.photo_url ? await dwStorage.deleteFile(photo.photo_url) : true;
    if (!deleteSuccess) {
      throw new Error('Failed to delete file from CDN');
    }

    // Delete the record from the database
    await db
      .deleteFrom('gallery_content')
      .where('uuid', '=', photo_uuid)
      .execute();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Photo deleted successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error deleting photo:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 