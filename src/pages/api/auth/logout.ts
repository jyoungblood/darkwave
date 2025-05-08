// DW - Auth - Logout API route

import { auth } from "@/lib/auth/better";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, redirect }) => {
  try {
    // console.log("Logging out user");
    
    // Call Better Auth's signOut method
    await auth.api.signOut({
      headers: request.headers
    });
    
    // Redirect to home page after sign out
    return redirect("/");
  } catch (error) {
    console.error("Logout error:", error);
    return redirect("/?error=logout-failed");
  }
}; 