// DW - Photo crop API route

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

    // Get parameters from the request
    const { related_id, related_table, related_column, parameters } = await request.json();
    
    if (!related_id || !related_table || !related_column || !parameters) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: related_id, related_table, related_column, or parameters'
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
      true, // Require ownership for photo cropping
      db
    );

    if (authError) {
      return new Response(JSON.stringify({ error: authError.error }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the database record with crop parameters
    const updateData: Record<string, string> = {
      [`${related_column}_parameters`]: parameters,
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
    console.error('Crop error:', error);
    return new Response(JSON.stringify({ 
      error: 'Crop failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 