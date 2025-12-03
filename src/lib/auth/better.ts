// DW - Auth - Better-auth config

import { betterAuth } from 'better-auth';
import { sendEmail } from '@/lib/dw/email'
import { pool } from '@/lib/db';

// Store flags that need to persist across requests
const skipVerificationFlags = new Map<string, boolean>();

// Constants for cleanup
const CLEANUP_INTERVAL = 5000; // 5 seconds
const MAX_FLAGS = 1000; // Maximum number of flags to prevent memory issues
const MAX_AGE = 30000; // Maximum age of 30 seconds as a safety net

// Cleanup function that returns number of items cleaned
const cleanupFlags = () => {
  const now = Date.now();
  const fiveSecondsAgo = now - 5000;
  const maxAge = now - MAX_AGE;
  let cleaned = 0;

  // Safety check - if we somehow have too many flags, clear them all
  if (skipVerificationFlags.size > MAX_FLAGS) {
    const size = skipVerificationFlags.size;
    skipVerificationFlags.clear();
    console.warn(`Memory safety: Cleared ${size} verification flags due to exceeding limit of ${MAX_FLAGS}`);
    return size;
  }

  // Normal cleanup of expired flags
  for (const [key] of skipVerificationFlags.entries()) {
    const timestamp = parseInt(key.split('-')[1]);
    // Clean if it's expired or if it's too old (safety net)
    if (timestamp < fiveSecondsAgo || timestamp < maxAge) {
      skipVerificationFlags.delete(key);
      cleaned++;
    }
  }

  return cleaned;
};

// Start the cleanup interval
const cleanupInterval = setInterval(() => {
  cleanupFlags();
}, CLEANUP_INTERVAL);

// Clean up the interval if the module is reloaded
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(cleanupInterval);
    skipVerificationFlags.clear();
  });
}

export const auth = betterAuth({
  baseURL: import.meta.env.SITE_BASE_URL,
  secret: import.meta.env.BETTER_AUTH_SECRET,
  basePath: '/api/auth/better',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url, token }, ctx) => {
      try {
        const siteName = import.meta.env.SITE_TITLE;
        await sendEmail({
          to: user.email,
          from: `"${siteName}" <${import.meta.env.NOTIFICATIONS_EMAIL}>`,
          subject: `Reset your password for ${siteName}`,
          message: {
            template: '@/email-templates/auth/reset-password',
            data: {
              siteName,
              url,
            }
          },
        });
      } catch (error) {
        console.error('Error in sendResetPassword:', error);
      }
    },
  },
  socialProviders: import.meta.env.GOOGLE_CLIENT_ID && import.meta.env.GOOGLE_CLIENT_SECRET ? {
    google: { 
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    },
  } : {},
  // Define the OAuth callback configuration
  callbackURLs: {
    default: "/dashboard", // Where to redirect after successful OAuth sign-in
    error: "/login?error=auth-failed", // Where to redirect on error
  },

  emailVerification: {
    sendOnSignUp: true,  // Keep email verification enabled
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, ctx) => {
      // Check if this is an admin-created user
      // Look for any flags for this email in the last 5 seconds
      const now = Date.now();
      const fiveSecondsAgo = now - 5000;
      const possibleKeys = Array.from(skipVerificationFlags.keys())
        .filter(key => key.startsWith(user.email + '-') && 
                parseInt(key.split('-')[1]) > fiveSecondsAgo);
      
      const isAdminCreation = possibleKeys.length > 0;
      if (isAdminCreation) {
        return;
      }
      try {
        // Create our custom verification URL with the correct path
        const customVerificationUrl = `${import.meta.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}`;        
        const siteName = import.meta.env.SITE_TITLE;
        await sendEmail({
          to: user.email,
          from: `"${siteName}" <${import.meta.env.NOTIFICATIONS_EMAIL}>`,
          subject: `Verify your email for ${siteName}`,
          message: {
            template: '@/email-templates/auth/verify-email',
            data: {
              siteName,
              url: customVerificationUrl,
            }
          },
        });
      } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
      }
    },
  },
  database: pool,
  plugins: [],

  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
    // Session expiration will refresh to 1 year from now on each use
  },

  hooks: {
    before: async (ctx: any) => {
      // Check if this is a signup request by path
      if (ctx.path === '/sign-up/email' && ctx.body?.metadata?.isAdminCreation) {
        // Generate a unique key for this request
        const key = `${ctx.body.email}-${Date.now()}`;
        skipVerificationFlags.set(key, true);
      }
      return ctx;
    },
    after: async (ctx: any) => {
      return ctx;
    }
  }
});