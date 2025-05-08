import { handleSoftDelete } from '@/lib/dw-crud';
import type { APIRoute } from "astro";

// API endpoint for email/password login
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return handleSoftDelete(request, cookies, locals, {
    table: 'horses',
    // Optionally add afterDelete if needed:
    // afterDelete: async ({ db, uuid }) => {
    //   // Handle any cleanup of related records
    // }
  });
};