// DW - Validate unique API route

import type { APIRoute } from 'astro';
import { db } from '@/lib/db';
import { z } from 'zod';

// Define the request schema
const requestSchema = z.object({
  collection: z.string(),
  field: z.string(),
  value: z.string(),
  exempt: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { collection, field, value, exempt } = requestSchema.parse(body);

    // Build the query
    let query = db
      .selectFrom(collection as any)
      .select('id')
      .where(field as any, '=', value);

    // Add exempt conditions if provided
    if (exempt) {
      Object.entries(exempt).forEach(([key, exemptValue]) => {
        query = query.where(key as any, '!=', exemptValue);
      });
    }

    // Execute the query
    const result = await query.executeTakeFirst();

    // Return success if no matching record found
    return new Response(JSON.stringify({ 
      isUnique: !result,
      error: null
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in validate-unique:', error);
    
    return new Response(JSON.stringify({ 
      isUnique: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
