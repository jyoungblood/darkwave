// DW - Auth - Register OAuth API route

import { auth } from "@/lib/auth/better";
import { validateCsrf } from "@/lib/csrf";
import type { APIRoute } from "astro";

// API endpoint to handle OAuth registration
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
    
    // Get the OAuth provider from form data
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
      // console.log(`Initiating OAuth registration flow for provider: ${provider}`);
      
      // Call Better Auth's API to initiate the OAuth flow
      // Better Auth doesn't differentiate between sign-in and sign-up for OAuth
      // The same method is used for both, and it'll create an account if one doesn't exist
      // Let Better Auth handle the callback with its default callback handler
      const result = await auth.api.signInSocial({
        body: {
          provider: provider as any, // Type cast as the provider may be restricted
          // Do not specify callbackURL - let Better Auth use its default one
          // Additional options for new user registration
          userData: {
            // We can add additional user data here if needed
          }
        }
      });
      
      // console.log("OAuth registration result:", result);
      
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
    console.error('Unexpected error in OAuth registration:', error);

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