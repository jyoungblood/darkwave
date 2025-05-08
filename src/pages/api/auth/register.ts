// DW - Auth - Register API route

import { validateCsrf } from "@/lib/csrf";
import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

// API endpoint for email/password registration with Better Auth
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    
    // Validate CSRF token
    await validateCsrf({ formData, cookies });
    
    // Extract registration details from form data
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      // Call Better Auth API to sign up the user
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "" // Empty name, but satisfies the API requirement
        }
      });

      // Success - Better Auth does not directly return an error property
      // Always require email verification
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Please check your email to confirm your registration"
        }), 
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (authError: any) {
      // Better Auth throws errors rather than returning them
      console.error('Registration error:', authError);
      
      return new Response(
        JSON.stringify({ error: authError.message || "Registration failed" }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in registration:', error);

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
        error: "Registration failed. Please try again later."
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}; 