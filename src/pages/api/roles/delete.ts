// DW - Delete role

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw/auth-roles';
import type { APIRoute } from "astro";

// Default role IDs that cannot be deleted
const DEFAULT_ROLE_IDS = [1, 2, 3, 4];

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!locals.authRoles?.includes("admin")) {
    return new Response(JSON.stringify({ error: 'You are not authorized to delete roles' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { uuid, csrf: csrfToken } = body;

    // Validate CSRF token
    const storedToken = cookies.get('csrf')?.value;
    if (!csrfToken || !storedToken || csrfToken !== storedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!uuid) {
      return new Response(
        JSON.stringify({ error: 'Role ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let roleId = parseInt(uuid);
    if (isNaN(roleId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deletion of default roles
    if (DEFAULT_ROLE_IDS.includes(roleId)) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete default system roles' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if role exists
    let role = await db
      .selectFrom('auth_roles')
      .select(['id', 'name'])
      .where('id', '=', roleId)
      .executeTakeFirst();

    if (!role) {
      return new Response(
        JSON.stringify({ error: 'Role not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the role (cascade will handle rel_users_roles via foreign key)
    await db
      .deleteFrom('auth_roles')
      .where('id', '=', roleId)
      .execute();

    // Clear all role cache since roles changed
    clearRoleCache();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Role deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error deleting role:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
