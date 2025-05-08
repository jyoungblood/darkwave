// DW - Auth - Middleware

import { auth } from "@/lib/auth/better";
import { defineMiddleware } from "astro/middleware";
import type { AstroCookies } from "astro";
import { managedRoutes } from "@/config/app";
import { verifyUserRoles } from "@/lib/dw-auth-roles";

// Helper function to check if path matches any pattern in the array
function matchesAny(path: string, routes: readonly string[]): boolean {
  return routes.some(route => {
    const regexPattern = route
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const pattern = new RegExp(`^${regexPattern}\/?$`);
    return pattern.test(path);
  });
}

// Helper function to check and validate session
const validateSession = async (
  request: Request,
  cookies: AstroCookies
) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session || !session.user) {
      return null;
    }

    const { roles, version } = await verifyUserRoles(session.user.id);
    
    return {
      user: session.user,
      authRoles: roles,
      rolesVersion: version
    };
    
  } catch (err) {
    console.error("Session validation error:", err);
    return null;
  }
};

// Helper to set user data in locals
const setUserData = (locals: App.Locals, data: any) => {
  locals.isAuthenticated = true;
  locals.email = data.user?.email!;
  locals.userId = data.user?.id!;
  
  // Ensure authRoles is an array
  const roles = Array.isArray(data.authRoles) ? [...data.authRoles] : [];
  
  // Add "user" role if not already present in authRoles
  if (!roles.includes("user")) {
    roles.push("user");
  }
  
  locals.authRoles = roles;
  locals.rolesVersion = data.rolesVersion;
};

export const onRequest = defineMiddleware(
  async ({ locals, url, cookies, request, redirect }, next) => {

    locals.isAuthenticated = false;
    
    // Try to validate session for all routes
    const userData = await validateSession(request, cookies);
    if (userData) {
      setUserData(locals, userData);
    }

    // Handle Admin routes
    if (matchesAny(url.pathname, managedRoutes.admin)) {
      if (!locals.authRoles?.includes("admin")) {
        return redirect("/");
      }
    }    

    // Handle protected routes
    if (matchesAny(url.pathname, managedRoutes.protected)) {
      if (!userData) {
        return redirect("/login");
      }
    }

    // Handle redirect routes
    if (matchesAny(url.pathname, managedRoutes.redirect) && userData) {
      return redirect("/");
    }

    // Get the response from next()
    const response = await next();

    // Only add version check if we have a version number
    if (locals.rolesVersion) {
      const html = await response.text();
      
      // Add both cookie-based and JS-based version checking
      const script = `
        <script>
          // JavaScript-based version check
          const currentVersion = ${locals.rolesVersion};
          const lastVersion = localStorage.getItem('rolesVersion') || 0;
          if (currentVersion > lastVersion) {
            localStorage.setItem('rolesVersion', currentVersion);
            window.location.reload();
          }
        </script>
        <noscript>
          <!-- Fallback for no JavaScript -->
          <meta http-equiv="refresh" content="0;url=${url.pathname}?rolesVersion=${locals.rolesVersion}">
        </noscript>
      `;
      
      // Set a cookie with the current version
      cookies.set('rolesVersion', locals.rolesVersion.toString(), {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
      });

      return new Response(html.replace('</head>', `${script}</head>`), {
        headers: response.headers
      });
    }

    return response;
  }
);
