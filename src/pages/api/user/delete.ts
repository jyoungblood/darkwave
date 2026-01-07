// DW - Delete user

import { db } from '@/lib/db';
import { clearRoleCache } from '@/lib/dw/auth-roles';
import { dwStorage } from '@/lib/dw/storage';
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!locals.userId || !locals.authRoles) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!locals.authRoles?.includes("admin")) {
    return new Response(JSON.stringify({ error: 'You are not authorized to delete users' }), {
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
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use uuid as the user id (ButtonDelete sends uuid prop)
    const id = uuid;

    // Prevent self-deletion
    if (id === locals.userId) {
      return new Response(
        JSON.stringify({ error: 'You cannot delete your own account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the user to get avatar URL before deletion
    let user = await db
      .selectFrom('user')
      .select(['id', 'image'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete rel_users_roles records
    await db
      .deleteFrom('rel_users_roles')
      .where('user_id', '=', id)
      .execute();

    // Clear role cache for this user
    await clearRoleCache(id);

    // Delete avatar if it exists
    if (user.image) {
      try {
        // Extract the relative path from the full URL for cleanup
        const url = new URL(user.image);
        const relativePath = url.pathname.replace(/^\/+/, '');
        
        // Delete the original file
        await dwStorage.deleteFile(user.image);
        
        // Clean up all transformed versions (if cleanup is supported)
        try {
          const cleanupResult = await dwStorage.deleteTransformedVersions(relativePath);
          if (cleanupResult !== null) {
            // console.log(`🧹 Cleanup completed: ${cleanupResult} transformed versions deleted`);
          } else {
            console.error(`Error: Cleanup not supported by current storage provider`);
          }
        } catch (cleanupError) {
          console.error('Error during transformed version cleanup:', cleanupError);
          // Continue even if cleanup fails - original file is already deleted
        }
      } catch (error) {
        console.error('Error deleting avatar from storage:', error);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete the user record
    await db
      .deleteFrom('user')
      .where('id', '=', id)
      .execute();

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
