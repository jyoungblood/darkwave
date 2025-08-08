// DW - Update user (user updating their own account)

import { db } from '@/lib/db';
import type { APIRoute } from "astro";
import { auth } from "@/lib/auth/better";
import { validateCsrf } from "@/lib/csrf";

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
    const id = locals.userId;
    const email = formData.get("email")?.toString();
    const newPassword = formData.get("newPassword")?.toString();
    const currentPassword = formData.get("currentPassword")?.toString();
    const name = formData.get("name")?.toString();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password change request
    if (newPassword && !currentPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password is required to change password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // if (!email || !name) {
    //   return new Response(
    //     JSON.stringify({ error: 'Email and name are required' }),
    //     { status: 400, headers: { 'Content-Type': 'application/json' } }
    //   );
    // }

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


    // Update password if provided
    if (newPassword && currentPassword) {
      try {
        await auth.api.changePassword({
          body: {
            newPassword: newPassword,
            currentPassword: currentPassword
          },
          headers: request.headers
        });
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to update password' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }



    return new Response(
      JSON.stringify({ 
        success: true, 
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