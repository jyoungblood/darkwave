// DW - Demo delete endpoint for form testing

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Just return success - this is for testing UI components only
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Demo delete operation completed! This is just a test endpoint."
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Demo delete endpoint error:", error);
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