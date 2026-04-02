import { sendEmail } from "@/lib/dw/email";

import { validateCsrf } from "@/lib/csrf";
import type { APIRoute } from "astro";

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

async function verifyTurnstileResponse(
  token: string,
  secret: string,
  remoteIp: string,
): Promise<boolean> {
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIp,
  });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

// API endpoint for contact form
export const POST: APIRoute = async ({ request, cookies }) => {

  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });

    const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY?.trim();
    if (turnstileSecret) {
      const token = (formData.get('cf_turnstile_response') as string | null)?.trim();
      if (!token) {
        return new Response(JSON.stringify({ error: 'Please complete the verification.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const turnstileOk = await verifyTurnstileResponse(
        token,
        turnstileSecret,
        getClientIp(request),
      );
      if (!turnstileOk) {
        return new Response(JSON.stringify({ error: 'Verification failed. Please try again.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const result = await sendEmail({
      to: import.meta.env.CONTACT_EMAIL,
      from: `${import.meta.env.SITE_TITLE} Contact Form <${import.meta.env.NOTIFICATIONS_EMAIL}>`,
      replyTo: formData.get('email') as string,
      subject: `[${import.meta.env.SITE_TITLE} Contact Form] ${formData.get('subject')}`,
      message: {
        template: '@/email-templates/contact-form',
        data: {
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          subject: formData.get('subject') as string,
          message: formData.get('message') as string,
          siteName: import.meta.env.SITE_TITLE,
        }
      },
    });

    return new Response(JSON.stringify({ success: 'Email sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });


  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};