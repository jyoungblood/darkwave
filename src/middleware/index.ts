// DW - Auth - Middleware

import { auth } from "@/lib/auth/better";
import { defineMiddleware } from "astro/middleware";
import type { AstroCookies } from "astro";
import { managedRoutes } from "@/config/app";
import { verifyUserRoles } from "@/lib/dw/auth-roles";
import { db } from "@/lib/db";

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

    const { roles, version } = await verifyUserRoles((session.user as any).id);
    
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
  locals.name = data.user?.name!;
  
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

    // Skip middleware entirely for bypass routes to preserve caching headers
    if (matchesAny(url.pathname, managedRoutes.bypass)) {
      return next();
    }

    locals.isAuthenticated = false;
    
    // Try to validate session for all routes
    const userData = await validateSession(request, cookies);
    if (userData) {
      setUserData(locals, userData);
      
      // Check if user is banned - log them out immediately
      if (userData.authRoles?.includes("banned")) {
        const userId = (userData.user as any).id;
        
        // Revoke all their sessions from database
        try {
          await db
            .deleteFrom('session')
            .where('userId', '=', userId)
            .execute();
        } catch (dbError) {
          console.error("Error deleting sessions for banned user:", dbError);
        }
        
        // Also try to sign out via Better Auth (clears cookies)
        try {
          await auth.api.signOut({
            headers: request.headers
          });
        } catch (signOutError) {
          console.error("Error signing out banned user:", signOutError);
        }
        
        // Redirect to login with banned message
        return redirect("/login?error=" + encodeURIComponent("Account has been banned"));
      }
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

    // Handle protected routes
    if (matchesAny(url.pathname, managedRoutes.protectedRedirect)) {
      if (!userData) {
        return redirect("/login?redirect=" + encodeURIComponent(url.pathname));
      }
    }

    // Handle redirect routes
    if (matchesAny(url.pathname, managedRoutes.redirect) && userData) {
      return redirect("/");
    }

    // Get the response from next()
    const response = await next();
    
    // Check if this is a redirect response - if so, pass it through unchanged
    const status = response.status;
    if (status >= 300 && status < 400) {
      return response;
    }
    
    // Only add version check if we have a version number and it's not a feed response
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
