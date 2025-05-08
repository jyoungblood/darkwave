import { handleSave } from '@/lib/dw-crud';
import type { APIRoute } from "astro";
import { formatMySQLDateTime, formatSlug, formatString } from '@/lib/dw';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const name = formData.get("name")?.toString();

  return handleSave(formData, request, cookies, locals, {
    table: 'horses',
    recordData: {
      name,
      slug: formatSlug(name),
      breed: formatString(formData.get("breed")),
      color: formatString(formData.get("color")),
      foal_year: formatString(formData.get("foal_year")),
      sex: formatString(formData.get("sex")),
      url_website: formatString(formData.get("url_website")),
      url_video: formatString(formData.get("url_video")),
      description: formatString(formData.get("description")),
      performance_record: formatString(formData.get("performance_record")),
      updated_at: formatMySQLDateTime(),
    },
    requiredFields: ['name', 'slug'],
    // KEEPING THIS AS AN OPTION, BUT NOT USING IT ANYWHERE 
    // photoFields: ['photo_url', 'alt_photo_url'],
    responseFields: ['name', 'breed'],
    async afterSave({ db, record, isNew }) {
      // Handle relationships for new horses
      if (isNew) {
        // await Promise.all([
        //   // Create ownership relationship
        //   db.insertInto('rel_horses_users')
        //     .values({ 
        //       user_id: locals.userId,
        //       horse_id: record.uuid,
        //       role: 'owner',
        //       created_at: formatMySQLDateTime()
        //     })
        //     .execute(),
          
        //   // Create pedigree record
        //   db.insertInto('rel_horses_pedigrees')
        //     .values({ 
        //       horse_id: record.uuid,
        //       created_at: formatMySQLDateTime()
        //     })
        //     .execute()
        // ]);
      }

      // // Handle pedigree updates for both new and existing horses
      // // First check if record exists
      // const existingPedigree = await db
      //   .selectFrom('rel_horses_pedigrees')
      //   .select('horse_id')
      //   .where('horse_id', '=', record.uuid)
      //   .executeTakeFirst();
      
      // // Define the pedigree data
      // const pedigreeData = {
      //   horse_id: record.uuid,
      //   sire_1_name: formatString(formData.get("sire_1_name")),
      //   sire_1_id: formatString(formData.get("sire_1_id")),
      //   sire_2_name: formatString(formData.get("sire_2_name")),
      //   sire_2_id: formatString(formData.get("sire_2_id")),
      //   sire_3_name: formatString(formData.get("sire_3_name")),
      //   sire_3_id: formatString(formData.get("sire_3_id")),
      //   sire_4_name: formatString(formData.get("sire_4_name")),
      //   sire_4_id: formatString(formData.get("sire_4_id")),
      //   sire_5_name: formatString(formData.get("sire_5_name")),
      //   sire_5_id: formatString(formData.get("sire_5_id")),
      //   sire_6_name: formatString(formData.get("sire_6_name")),
      //   sire_6_id: formatString(formData.get("sire_6_id")),
      //   sire_7_name: formatString(formData.get("sire_7_name")),
      //   sire_7_id: formatString(formData.get("sire_7_id")),
      //   dam_1_name: formatString(formData.get("dam_1_name")),
      //   dam_1_id: formatString(formData.get("dam_1_id")),
      //   dam_2_name: formatString(formData.get("dam_2_name")),
      //   dam_2_id: formatString(formData.get("dam_2_id")),
      //   dam_3_name: formatString(formData.get("dam_3_name")),
      //   dam_3_id: formatString(formData.get("dam_3_id")),
      //   dam_4_name: formatString(formData.get("dam_4_name")),
      //   dam_4_id: formatString(formData.get("dam_4_id")),
      //   dam_5_name: formatString(formData.get("dam_5_name")),
      //   dam_5_id: formatString(formData.get("dam_5_id")),
      //   dam_6_name: formatString(formData.get("dam_6_name")),
      //   dam_6_id: formatString(formData.get("dam_6_id")),
      //   dam_7_name: formatString(formData.get("dam_7_name")),
      //   dam_7_id: formatString(formData.get("dam_7_id")),
      // };
      
      // if (existingPedigree) {
      //   // Update existing record
      //   await db
      //     .updateTable('rel_horses_pedigrees')
      //     .set(pedigreeData)
      //     .where('horse_id', '=', record.uuid)
      //     .execute();
      // } else {
      //   // Insert new record (although this should rarely happen since we create it above for new horses)
      //   await db
      //     .insertInto('rel_horses_pedigrees')
      //     .values({
      //       ...pedigreeData,
      //       created_at: formatMySQLDateTime()
      //     })
      //     .execute();
      // }
      
    }
  });
}; 