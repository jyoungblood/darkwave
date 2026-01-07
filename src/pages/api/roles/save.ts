// DW - Create, update, or delete roles

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw/auth-roles';
import { validateCsrf } from "@/lib/csrf";
import type { InsertObject } from 'kysely';
import type { Database } from '@/config/schema';

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
    return new Response(JSON.stringify({ error: 'You are not authorized to manage roles' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    await validateCsrf({ formData, cookies });

    // Get roles from QAN component
    let rolesJson = formData.get('roles')?.toString();
    if (!rolesJson) {
      return new Response(
        JSON.stringify({ error: 'No roles data provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let submittedRoles: Array<{
      id?: number;
      name?: string;
      description?: string;
      _canDelete?: boolean;
    }> = [];

    try {
      submittedRoles = JSON.parse(rolesJson);
      if (!Array.isArray(submittedRoles)) {
        throw new Error('Invalid roles format');
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid roles data format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all existing roles from database
    let existingRoles = await db
      .selectFrom('auth_roles')
      .selectAll()
      .execute();

    let existingRoleIds = new Set(existingRoles.map(r => r.id));
    let submittedRoleIds = new Set(
      submittedRoles
        .filter(r => r.id && typeof r.id === 'number')
        .map(r => r.id as number)
    );

    // Find roles to delete (existing but not in submitted)
    let rolesToDelete = existingRoles.filter(role => {
      // Never delete default roles
      if (DEFAULT_ROLE_IDS.includes(role.id)) {
        return false;
      }
      // Delete if it's not in the submitted list
      return !submittedRoleIds.has(role.id);
    });

    // Delete roles that were removed
    let deletedCount = 0;
    for (let roleToDelete of rolesToDelete) {
      await db
        .deleteFrom('auth_roles')
        .where('id', '=', roleToDelete.id)
        .execute();
      deletedCount++;
    }

    // Process submitted roles (update existing or create new)
    let updatedCount = 0;
    let createdCount = 0;

    for (let submittedRole of submittedRoles) {
      // Skip invalid entries
      if (!submittedRole.name || typeof submittedRole.name !== 'string' || !submittedRole.name.trim()) {
        continue;
      }

      let name = submittedRole.name.trim();
      let description = submittedRole.description?.trim() || null;

      // If role has an ID, it's an existing role - update it
      if (submittedRole.id && typeof submittedRole.id === 'number' && existingRoleIds.has(submittedRole.id)) {
        await db
          .updateTable('auth_roles')
          .set({
            name,
            description,
          })
          .where('id', '=', submittedRole.id)
          .execute();

        updatedCount++;
      } else {
        // No ID means it's a new role - create it
        await db
          .insertInto('auth_roles')
          .values({
            name,
            description,
          } as InsertObject<Database, 'auth_roles'>)
          .execute();

        createdCount++;
      }
    }

    // Clear all role cache since roles changed
    if (updatedCount > 0 || createdCount > 0 || deletedCount > 0) {
      clearRoleCache();
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        updated: updatedCount,
        created: createdCount,
        deleted: deletedCount
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
