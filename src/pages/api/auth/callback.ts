// DW - Auth - Callback API route

import type { APIRoute } from "astro";

// This endpoint handles the OAuth callback for Better Auth
export const GET: APIRoute = async ({ request, redirect }) => {
  try {
    // Extract the query parameters from the URL
    const url = new URL(request.url);
    
    // console.log("OAuth callback received with params:", Object.fromEntries(url.searchParams.entries()));
    
    // This is primarily a passthrough to the Better Auth callback handler
    // We'll redirect to the Better Auth callback endpoint with all the same parameters
    const betterAuthCallbackUrl = new URL(`${url.origin}/api/auth/better/callback/google`);
    
    // Copy all query parameters from the original URL
    url.searchParams.forEach((value, key) => {
      betterAuthCallbackUrl.searchParams.append(key, value);
    });
    
    // console.log("Redirecting to Better Auth callback:", betterAuthCallbackUrl.toString());
    
    // Redirect to the Better Auth callback endpoint
    return Response.redirect(betterAuthCallbackUrl.toString(), 302);
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error);
    
    // Redirect to login page with error parameter
    return redirect('/login?error=oauth-callback-failed');
  }
}; 