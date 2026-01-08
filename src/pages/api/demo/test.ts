// DW - Demo test endpoint for form testing

import type { APIRoute } from "astro";
import { validateCsrf } from "@/lib/csrf";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const formData = await request.formData();
    await validateCsrf({ formData, cookies });

    // Just return success - this is for testing UI components only
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Demo form submitted successfully! This is just a test endpoint."
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Demo test endpoint error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};