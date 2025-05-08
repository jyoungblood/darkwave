// DW - Auth - Login API route

import { auth } from "@/lib/auth/better";
import { validateCsrf } from "@/lib/csrf";
import type { APIRoute } from "astro";

// API endpoint for email/password login
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
    
    // Extract login credentials from form data
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
      // console.log(`Attempting login for email: ${email}`);
      
      // Get the session response by using asResponse: true
      const result = await auth.api.signInEmail({
        body: {
          email,
          password
        },
        asResponse: true // Get the raw response so we can extract cookies
      });

      // Check if the response was successful
      if (!result.ok) {
        // Better Auth returned an error
        const errorData = await result.json();
        console.error("Better Auth login error:", errorData);
        
        let errorMessage = "Invalid email or password";
        let statusCode = 401;
        
        if (errorData.error) {
          if (errorData.error.includes("verified")) {
            errorMessage = "Please verify your email before logging in";
            statusCode = 403;
          } else if (errorData.error.includes("banned") || errorData.error.includes("suspended")) {
            errorMessage = "Account has been banned";
            statusCode = 403;
          } else if (errorData.error.includes("too many")) {
            errorMessage = "Too many login attempts. Please try again later";
            statusCode = 429;
          }
        }
        
        return new Response(
          JSON.stringify({ error: errorMessage }), 
          { 
            status: statusCode,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // console.log("Login API response status:", result.status);
      
      // Extract cookies from the response
      const setCookieHeader = result.headers.get('set-cookie');
      // console.log("Set-Cookie header present:", !!setCookieHeader);
      
      // Create our custom response with success status
      const response = new Response(
        JSON.stringify({ 
          success: true,
          redirectTo: "/dashboard" 
        }), 
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      // If cookies were set, pass them along to our response
      if (setCookieHeader) {
        response.headers.set('set-cookie', setCookieHeader);
      }
      
      return response;
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed";
      let statusCode = 401;
      
      if (error.message) {
        if (error.message.includes("verified")) {
          errorMessage = "Please verify your email before logging in";
          statusCode = 403;
        } else if (error.message.includes("banned")) {
          errorMessage = "Account has been banned";
          statusCode = 403;
        } else if (error.message.includes("password") || error.message.includes("credentials")) {
          errorMessage = "Invalid email or password";
          statusCode = 401;
        } else {
          errorMessage = error.message;
        }
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }), 
        { 
          status: statusCode,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in login:', error);

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
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}; 