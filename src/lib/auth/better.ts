// DW - Auth - Better-auth config

import { betterAuth } from 'better-auth';
import { sendEmail } from '@/lib/dw-email'
import { pool } from '@/lib/db';
 
export const auth = betterAuth({
  baseURL: import.meta.env.BETTER_AUTH_URL,
  basePath: '/api/auth/better',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        const siteName = import.meta.env.SITE_TITLE;
        await sendEmail({
          to: user.email,
          from: `"${siteName}" <${import.meta.env.SMTP_USER}>`,
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
  socialProviders: {
    google: { 
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    },
  },
  // Define the OAuth callback configuration
  callbackURLs: {
    default: "/dashboard", // Where to redirect after successful OAuth sign-in
    error: "/login?error=auth-failed", // Where to redirect on error
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    defaultCallbackURL: "/auth/verify-email",
    paths: {
      verifyEmail: "/auth/verify-email",
      emailVerifiedRedirect: "/auth/verify-email",
    },
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        // Create our custom verification URL with the correct path
        const customVerificationUrl = `${import.meta.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}`;        
        const siteName = import.meta.env.SITE_TITLE;
        await sendEmail({
          to: user.email,
          from: `"${siteName}" <${import.meta.env.SMTP_USER}>`,
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
});