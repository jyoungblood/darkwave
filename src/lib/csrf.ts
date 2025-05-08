// DW - CSRF utility

import type { AstroCookies } from 'astro';

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  secure: import.meta.env.PROD,
  httpOnly: true,
  maxAge: 31536000
} as const;

/**
 * Generates a random CSRF token
 */
function generateCsrfToken() {
  return crypto.randomUUID();
}

/**
 * Ensures a CSRF token exists in cookies, creating one if needed
 */
export function ensureCsrfToken(cookies: AstroCookies) {
  let token = cookies.get('csrf')?.value;
  if (!token) {
    token = generateCsrfToken();
    cookies.set('csrf', token, {
      ...COOKIE_OPTIONS,
      maxAge: 3600 // CSRF tokens expire after 1 hour
    });
  }
  return token;
}

/**
 * Validates CSRF token from form submission against cookie value
 * @throws Error if CSRF token is invalid or missing
 */
export async function validateCsrf({ 
  formData, 
  cookies 
}: { 
  formData: FormData, 
  cookies: AstroCookies 
}) {
  const csrfToken = formData.get('csrf')?.toString();
  const storedToken = cookies.get('csrf')?.value;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    throw new Error('Invalid CSRF token');
  }

  return formData;
}
