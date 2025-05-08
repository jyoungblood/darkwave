// DW - Auth - Verify email email template

export function render(data: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Please verify your email address</h2>
      <p>Thank you for registering with ${data.siteName}.</p>
      <p>Click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.url}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">
        ${data.url}
      </p>
      <p>This link is valid for 24 hours.</p>
      <p style="color: #666; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
        If you did not create an account with ${data.siteName}, you can safely ignore this email.
      </p>
    </div>
  `;
} 