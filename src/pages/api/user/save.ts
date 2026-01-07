// DW - Create or update user

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw/auth-roles';
import { auth } from '@/lib/auth/better';
import { validateCsrf } from "@/lib/csrf";

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
    await validateCsrf({ formData, cookies });
    const id = formData.get("id")?.toString();
    const email = formData.get("email")?.toString();
    const first_name = formData.get("first_name")?.toString() || null;
    const last_name = formData.get("last_name")?.toString() || null;
    const password = formData.get("password")?.toString();


    if (!locals.authRoles?.includes("admin")) {
      return new Response(JSON.stringify({ error: 'You are not authorized to manage users' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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
        // Construct name from first_name and last_name, or use empty string
        let name = "";
        if (first_name || last_name) {
          name = [first_name, last_name].filter(Boolean).join(" ").trim();
        }

        const authResult = await auth.api.signUpEmail({
          headers: request.headers,
          body: {
            email,
            password,
            name,
            first_name,
            last_name,
            metadata: {
              isAdminCreation: true
            }
          }
        } as any);

        // Get the user ID from the result
        userId = (authResult as any).user.id;

        // Mark as verified immediately and save first_name/last_name
        await db
          .updateTable('user')
          .set({ 
            emailVerified: true,
            first_name,
            last_name,
          })
          .where('id', '=', userId as string)
          .execute();

        result = {
          id: userId,
          email,
          first_name,
          last_name,
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
        first_name,
        last_name,
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
        .select(['id', 'email', 'first_name', 'last_name'])
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
    if (error instanceof Error && error.message === 'Invalid CSRF token') {
      return new Response(JSON.stringify({
        error: 'Invalid request token. Please refresh the page and try again.'
      }), {
        status: 403
      });
    }
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 