// DW - Auth - Verify email API route

import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

// Custom handler for email verification
export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const callbackURL = url.searchParams.get("callbackURL");
  
  // console.log("API: Verification request received", { 
  //   token: token ? `${token.substring(0, 10)}...` : null,
  //   callbackURL: callbackURL || "(not provided)" // Log it, but we'll ignore it
  // });

  if (!token) {
    return redirect(`/auth/verify-email?error=${encodeURIComponent("Missing verification token")}`);
  }

  try {
    // Call the Better Auth API to verify the email
    const result = await auth.api.verifyEmail({
      query: { token }
    });
    
    // console.log("API: Verification successful");
    
    // Always redirect to our verification success page, ignoring any callbackURL
    return redirect(`/auth/verify-email?success=true`);
  } catch (error: any) {
    console.error("API: Verification failed", error);
    
    // Redirect to verification page with error
    return redirect(`/auth/verify-email?error=${encodeURIComponent(error.message || "Verification failed")}`);
  }
}; 