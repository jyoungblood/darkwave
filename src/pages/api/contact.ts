import { sendEmail } from "@/lib/dw-email";

import { validateCsrf } from "@/lib/csrf";
import type { APIRoute } from "astro";

// API endpoint for contact form
export const POST: APIRoute = async ({ request, cookies }) => {

  try {
    // Validate CSRF token and get formData
    const formData = await request.formData().catch(err => {
      console.error('Error parsing form data:', err);
      throw new Error('Invalid form data');
    });
    await validateCsrf({ formData, cookies });
        
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