// DW - Update user

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw-auth-roles';
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const email = formData.get("email")?.toString();
    const name = formData.get("name")?.toString();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dataToSave = {
      email,
      name,
      updatedAt: new Date(),
    };

    // Update the record
    await db
      .updateTable('user')
      .set(dataToSave)
      .where('id', '=', id)
      .execute();

    // Fetch the updated record
    const result = await db
      .selectFrom('user')
      .select(['id', 'email', 'name'])
      .where('id', '=', id)
      .executeTakeFirst();

    // Update roles
    const newRoles = formData.getAll("roles").map(role => parseInt(role.toString()));
    
    // Get current roles before updating
    const currentRoles = await db
      .selectFrom('rel_users_roles')
      .select('role_id')
      .where('user_id', '=', id)
      .execute()
      .then(roles => roles.map(r => r.role_id));

    // Check if roles have changed
    const rolesChanged = 
      currentRoles.length !== newRoles.length || 
      !currentRoles.every(role => newRoles.includes(role));

    // First delete all existing roles for this user
    await db
      .deleteFrom('rel_users_roles')
      .where('user_id', '=', id)
      .execute();

    // Then insert the new roles if any were selected
    if (newRoles.length > 0) {
      await db
        .insertInto('rel_users_roles')
        .values(newRoles.map(roleId => ({
          user_id: id,
          role_id: roleId,
          created_at: new Date()
        })))
        .execute();
    }

    // Clear role cache only if roles have changed
    if (rolesChanged) {
      await clearRoleCache(id);
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Record not found after update' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        rolesChanged // Include this in response for frontend awareness
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 