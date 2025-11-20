// DW - Gallery delete API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { dwStorage } from '@/lib/dw/storage';
import { checkAuthorizationWithOwnership, parseRelatedId } from '@/lib/auth/permissions';

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
    const { photo_uuid, related_id: related_id_raw, related_table } = await request.json();
    
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

    // Parse related_id if provided, otherwise use the value from database (already parsed)
    const effectiveRelatedId = related_id_raw 
      ? parseRelatedId(related_id_raw).value 
      : photo.related_id;
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

    // For authorization, we need to determine the ID column
    // If related_id_raw was provided, parse it to get the column; otherwise assume 'uuid' (default)
    const { column: idColumn } = related_id_raw 
      ? parseRelatedId(related_id_raw)
      : { column: 'uuid' };

    // Check authorization with ownership
    const authError = await checkAuthorizationWithOwnership(
      locals.userId,
      locals.authRoles,
      effectiveRelatedId,
      effectiveRelatedTable,
      true, // Require ownership for photo deletion
      db,
      idColumn
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the file from CDN
    if (photo.photo_url) {
      try {
        // Extract the relative path from the full URL for cleanup
        const url = new URL(photo.photo_url);
        const relativePath = url.pathname.replace(/^\/+/, '');
        
        // console.log(`🗑️  Deleting gallery photo: ${relativePath}`);
        
        // Delete the original file
        const deleteSuccess = await dwStorage.deleteFile(photo.photo_url);
        if (!deleteSuccess) {
          throw new Error('Failed to delete file from CDN');
        }
        
        // Clean up all transformed versions (if cleanup is supported)
        try {
          const cleanupResult = await dwStorage.deleteTransformedVersions(relativePath);
          if (cleanupResult !== null) {
            // console.log(`🧹 Cleanup completed: ${cleanupResult} transformed versions deleted`);
          } else {
            console.error(`Error: Cleanup not supported by current storage provider`);
          }
        } catch (cleanupError) {
          console.error('Error during transformed version cleanup:', cleanupError);
          // Continue even if cleanup fails - original file is already deleted
        }
        
      } catch (error) {
        console.error('Error deleting gallery photo:', error);
        throw error;
      }
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