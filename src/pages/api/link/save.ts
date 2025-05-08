import { handleSave } from '@/lib/dw-crud';
import type { APIRoute } from "astro";
import { formatMySQLDateTime, formatSlug } from '@/lib/dw';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString();

  return handleSave(formData, request, cookies, locals, {
    table: 'links',
    recordData: {
      title,
      slug: formatSlug(title),
      updated_at: formatMySQLDateTime(),
    },
    newRecordData: {
      user_id: locals.userId
    },
    requiredFields: ['title'],
    responseFields: ['uuid', 'slug']
  });
}; 