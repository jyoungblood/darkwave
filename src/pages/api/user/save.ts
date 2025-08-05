// DW - Create or update user

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw/auth-roles';
import { auth } from '@/lib/auth/better';

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
    const password = formData.get("password")?.toString();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userId = id;
    let result;

    // Handle user creation
    if (!id) {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required for new users' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        const authResult = await auth.api.signUpEmail({
          headers: request.headers,
          body: {
            email,
            password,
            name,
            metadata: {
              isAdminCreation: true
            }
          }
        } as any);

        // Get the user ID from the result
        userId = authResult.user.id;

        // Mark as verified immediately
        await db
          .updateTable('user')
          .set({ emailVerified: true })
          .where('id', '=', userId)
          .execute();

        result = {
          id: userId,
          email,
          name
        };
      } catch (authError: any) {
        console.error('Failed to create user:', authError?.message || authError);
        return new Response(
          JSON.stringify({ error: authError.message || "Failed to create user" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Handle user update
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
      result = await db
        .selectFrom('user')
        .select(['id', 'email', 'name'])
        .where('id', '=', id)
        .executeTakeFirst();

      if (!result) {
        return new Response(
          JSON.stringify({ error: 'Record not found after update' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update roles
    const newRoles = formData.getAll("roles").map(role => parseInt(role.toString()));
    
    // Get current roles before updating (empty array for new users)
    const currentRoles = id ? await db
      .selectFrom('rel_users_roles')
      .select('role_id')
      .where('user_id', '=', id)
      .execute()
      .then(roles => roles.map(r => r.role_id))
      : [];

    // Check if roles have changed
    const rolesChanged = 
      currentRoles.length !== newRoles.length || 
      !currentRoles.every(role => newRoles.includes(role));

    // First delete all existing roles for this user if it's an update
    if (id) {
      await db
        .deleteFrom('rel_users_roles')
        .where('user_id', '=', id)
        .execute();
    }

    // Then insert the new roles if any were selected
    if (newRoles.length > 0 && userId) {
      await db
        .insertInto('rel_users_roles')
        .values(newRoles.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          created_at: new Date()
        })))
        .execute();
    }

    // Clear role cache only if roles have changed and it's an update
    if (id && rolesChanged) {
      await clearRoleCache(id);
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