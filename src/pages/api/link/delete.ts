import { handleSoftDelete } from '@/lib/dw/crud';
import type { APIRoute } from "astro";

// API endpoint for email/password login
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  return handleSoftDelete(request, cookies, locals, {
    table: 'links'
  });
};