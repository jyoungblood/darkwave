// DW - Gallery update order API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
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

    // Get the array of photos with their new order and related entity info
    const { photos, related_id: related_id_raw, related_table } = await request.json();
    
    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No photos provided'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!related_id_raw || !related_table) {
      return new Response(JSON.stringify({ 
        error: 'Missing related entity information'
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse related_id to get column and value
    const { column: idColumn, value: related_id } = parseRelatedId(related_id_raw);

    // Check authorization with ownership
    const authError = await checkAuthorizationWithOwnership(
      locals.userId,
      locals.authRoles,
      related_id,
      related_table,
      true, // Require ownership for updating photo order
      db,
      idColumn
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify all photos belong to the same related entity
    const photoUuids = photos.map(photo => photo.uuid);
    const photosToVerify = await db
      .selectFrom('gallery_content')
      .select(['uuid', 'related_id', 'related_table'])
      .where('uuid', 'in', photoUuids)
      .execute();

    // Check if all photos exist and belong to the same related entity
    if (photosToVerify.length !== photoUuids.length) {
      return new Response(JSON.stringify({ 
        error: 'One or more photos not found'
      }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Verify all photos belong to the same related entity
    const invalidPhotos = photosToVerify.filter(
      photo => photo.related_id !== related_id || photo.related_table !== related_table
    );

    if (invalidPhotos.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'One or more photos do not belong to the specified entity'
      }), { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Update all photos concurrently
    const updatePromises = photos.map(photo => 
      db
        .updateTable('gallery_content')
        .set({ display_order: photo.display_order })
        .where('uuid', '=', photo.uuid)
        .execute()
    );

    await Promise.all(updatePromises);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Photo order updated successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error updating photo order:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update photo order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 