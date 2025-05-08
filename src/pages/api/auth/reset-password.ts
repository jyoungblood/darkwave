// DW - Auth - Reset password API route

import { validateCsrf } from "@/lib/csrf";
import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

// API endpoint to handle password reset after user clicks email link
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
    
    // Extract new password and token from form data
    const password = formData.get("password")?.toString();
    const token = formData.get("token")?.toString();

    // Validate password and token presence
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password is required" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Reset token is missing" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      // console.log("Attempting to reset password with token:", token);
      
      // Reset the user's password using Better Auth
      const result = await auth.api.resetPassword({
        body: {
          newPassword: password,
          token
        }
      });

      // console.log("Password reset successful:", result);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Password has been reset successfully." 
        }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (authError: any) {
      console.error('Password reset error:', authError);
      
      return new Response(
        JSON.stringify({ 
          error: authError.message || "Password reset failed. Please try again." 
        }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in password reset:', error);

    if (error instanceof Error && error.message === 'Invalid CSRF token') {
      return new Response(JSON.stringify({
        error: 'Invalid request token. Please refresh the page and try again.'
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({ 
        error: "Unable to reset password. Please try again later."
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}; 