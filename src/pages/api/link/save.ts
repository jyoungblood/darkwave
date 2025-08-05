import { handleSave } from '@/lib/dw/crud';
import type { APIRoute } from "astro";
import { formatMySQLDateTime, formatSlug, formatString } from '@/lib/dw/helpers';

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
      url: formatString(formData.get("url")),
      description: formatString(formData.get("description")),
      type: formatString(formData.get("type")),
      slug: formatSlug(title),
      updated_at: formatMySQLDateTime(),
    },
    newRecordData: {
      user_id: locals.userId
    },
    requiredFields: ['title'],
    responseFields: ['uuid', 'slug'],
    async afterSave({ db, record, isNew }) {
    // do stuff after saving here
      if (isNew) {
        // runs only if a new record is created
      }      
    }
  });
}; 