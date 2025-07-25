// DW - Auth - Login OAuth API route

import { auth } from "@/lib/auth/better";
import { validateCsrf } from "@/lib/csrf";
import type { APIRoute } from "astro";

// API endpoint to handle OAuth login requests (Google, GitHub, etc.)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
    
    // Get the OAuth provider (e.g., 'google', 'github') from the form data
    const provider = formData.get("provider")?.toString();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }), 
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Get the request URL origin (protocol + domain)
    const requestOrigin = new URL(request.url).origin;
    
    // Initiate OAuth flow with the specified provider
    try {
      // console.log(`Initiating OAuth login flow for provider: ${provider}`);
      
      // Call Better Auth's API to initiate the OAuth flow
      // Let Better Auth handle the callback with its default callback handler
      // Do NOT specify a callbackURL as Better Auth will use its default configured one
      const result = await auth.api.signInSocial({
        body: {
          provider: provider as any, // Type cast as the provider may be restricted
          callbackURL: "/dashboard" // Explicitly set the callback URL
        }
      });
      
      // console.log("OAuth initiation result:", result);
      
      // Better Auth should have returned a URL to redirect to
      if (!result?.url) {
        throw new Error("No authorization URL provided");
      }
      
      // Redirect user to the OAuth provider's consent page
      return Response.redirect(result.url);
    } catch (oauthError: any) {
      console.error('OAuth setup error:', oauthError);
      return new Response(
        JSON.stringify({ 
          error: oauthError.message || "Authentication failed. Please try again." 
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in OAuth login:', error);
    
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
        error: "An unexpected error occurred. Please try again.",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}; 