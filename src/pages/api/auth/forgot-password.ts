// DW - Auth - Forgot password API route

import { validateCsrf } from "@/lib/csrf";
import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

// API endpoint to handle password reset requests
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
    
    // Extract email from form submission
    const email = formData.get("email")?.toString();

    // Validate email presence
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      const origin = request.headers.get("origin") || "";
      
      // Send password reset email via Better Auth
      // This will trigger the sendResetPassword function in auth.ts
      // console.log("Sending password reset email to:", email);
      await auth.api.forgetPassword({
        body: {
          email,
          // This is where Better Auth will redirect after reset
          // No need to include the token in redirectTo as Better Auth adds it
          redirectTo: `${origin}/auth/reset-password`
        }
      });

      // console.log("Password reset email sent successfully");

      // Always return success to prevent email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If this email exists in our system, you will receive a password reset link shortly."
        }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (authError: any) {
      console.error('Password reset request error:', authError);
      
      // Always return success to prevent email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If this email exists in our system, you will receive a password reset link shortly." 
        }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in forgot password:', error);

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
        error: "Unable to process your request. Please try again later."
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}; 