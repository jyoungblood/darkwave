// DW - Email utility

import nodemailer from 'nodemailer';
// import mjml2html from 'mjml';
import { emailConfig } from '@/config/app';
import { htmlToPlainText } from '@/lib/dw/helpers';

// Helper to get env vars that works in both Vite and Node.js contexts
function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return process.env[key];
}

// Dynamically import all email templates - Vite will bundle them all at build time
// Vite transforms import.meta.glob at build time, replacing the call with actual imports
// We check for Vite context using import.meta.env.MODE (injected by Vite, doesn't exist in CLI)
// In production: isViteBuild=true, Vite transforms glob→templates, result is templates
// In CLI: isViteBuild=false, glob not called, result is {}
const isViteBuild = typeof import.meta !== 'undefined' && import.meta.env && 'MODE' in import.meta.env;
const templateModules = isViteBuild
  ? import.meta.glob('@/email-templates/**/*.tsx', { eager: true })
  : ({} as Record<string, any>);

// Debug: Log available templates in development
// In production, Vite transforms the glob above, so templates should always be available
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && Object.keys(templateModules).length === 0) {
  console.warn('Warning: No email templates found via glob. Available keys:', Object.keys(templateModules));
}

// Singleton transport instance
let mailTransporter: nodemailer.Transporter | null = null;

/**
 * Get email template module by path
 * Supports multiple path formats: @/email-templates/..., ./src/email-templates/..., src/email-templates/...
 */
function getEmailTemplate(templatePath: string): any {
  // Normalize the path to match the glob pattern format (@/email-templates/...)
  let normalizedPath = templatePath.trim();
  
  // Handle different path formats and convert to @/email-templates/... format
  if (normalizedPath.startsWith('./src/email-templates/')) {
    normalizedPath = normalizedPath.replace('./src/email-templates/', '@/email-templates/');
  } else if (normalizedPath.startsWith('src/email-templates/')) {
    normalizedPath = normalizedPath.replace('src/email-templates/', '@/email-templates/');
  } else if (normalizedPath.startsWith('@/email-templates/')) {
    // Already in correct format
  } else if (normalizedPath.startsWith('@/')) {
    // Handle @/something format - assume it's email-templates if it doesn't specify
    if (!normalizedPath.startsWith('@/email-templates/')) {
      normalizedPath = normalizedPath.replace('@/', '@/email-templates/');
    }
  } else {
    // Assume it's a relative path from email-templates
    normalizedPath = `@/email-templates/${normalizedPath.replace(/^\//, '')}`;
  }
  
  // Extract the template name (e.g., 'ticket-update' from '@/email-templates/ticket-update')
  const templateName = normalizedPath.replace(/^@\/email-templates\//, '').replace(/\.tsx$/, '');
  
  // Find matching template in the bundled modules
  // Try multiple matching strategies
  const availableKeys = Object.keys(templateModules);
  let templateKey = availableKeys.find(key => {
    // Match by template name (filename without extension)
    const keyName = key.replace(/^.*\//, '').replace(/\.tsx$/, '');
    return keyName === templateName;
  });
  
  // If not found, try full path matching
  if (!templateKey) {
    const normalizedWithExt = normalizedPath.endsWith('.tsx') ? normalizedPath : `${normalizedPath}.tsx`;
    templateKey = availableKeys.find(key => {
      const keyWithoutExt = key.replace(/\.tsx$/, '');
      return keyWithoutExt === normalizedPath || key === normalizedPath || key === normalizedWithExt;
    });
  }
  
  // If still not found, try partial matching (e.g., match 'ticket-update' anywhere in the path)
  if (!templateKey) {
    templateKey = availableKeys.find(key => {
      return key.includes(templateName) || key.includes('/' + templateName + '.');
    });
  }
  
  if (!templateKey || !templateModules[templateKey]) {
    const availableTemplates = availableKeys.length > 0 
      ? availableKeys.map(k => k.replace(/^.*\//, '').replace(/\.tsx$/, '')).join(', ')
      : 'none found (glob may not be working)';
    const allKeys = availableKeys.length > 0 ? availableKeys.join(', ') : 'no keys found';
    throw new Error(
      `Email template not found: ${templatePath}\n` +
      `Normalized path: ${normalizedPath}\n` +
      `Template name: ${templateName}\n` +
      `Available template names: ${availableTemplates}\n` +
      `All keys in templateModules: ${allKeys}\n` +
      `Total templates found: ${availableKeys.length}`
    );
  }
  
  return templateModules[templateKey];
}

// Mailgun API function
async function sendViaMailgun(data: EmailData) {
  const mailgunApiKey = getEnv('MAILGUN_API_KEY');
  const mailgunDomain = getEnv('MAILGUN_DOMAIN');
  
  if (!mailgunApiKey || !mailgunDomain) {
    throw new Error('Mailgun credentials not configured');
  }

  let html: string | undefined;
  
  // Process HTML from either template or direct input (same logic as SMTP version)
  if (data.message.template) {
    const templateModule = getEmailTemplate(data.message.template);
    html = templateModule.render(data.message.data || {});
  } else if (data.message.html) {
    html = data.message.html;
  }

  const formData = new FormData();
  formData.append('from', data.from);
  formData.append('to', Array.isArray(data.to) ? data.to.join(',') : data.to);
  formData.append('subject', data.subject);
  
  if (data.cc) {
    formData.append('cc', Array.isArray(data.cc) ? data.cc.join(',') : data.cc);
  }
  if (data.bcc) {
    formData.append('bcc', Array.isArray(data.bcc) ? data.bcc.join(',') : data.bcc);
  }
  if (data.replyTo) {
    formData.append('h:Reply-To', data.replyTo);
  }
  
  // Add text content
  formData.append('text', data.message.text || (html ? htmlToPlainText(html) : ''));
  
  // Add HTML content if available
  if (html) {
    formData.append('html', html);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.id,
    details: data
  };
}

function getTransporter() {
  if (!mailTransporter) {
    // console.log('Using SMTP transport');
    // Use SMTP transport
    mailTransporter = nodemailer.createTransport(emailConfig);
  }
  return mailTransporter
}

interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  message: {
    template?: string;
    text?: string;
    html?: string;
    data?: Record<string, any>;
    // mjml?: boolean;
  };
}


/**
 * Sends an email using the configured transporter
 * @param data Email data containing to, from, subject, and message details
 * @returns Email sending result with success status, message ID, and details
 */
export async function sendEmail(data: EmailData) {
  // Check if we should use Mailgun API
  const mailgunApiKey = getEnv('MAILGUN_API_KEY');
  const mailgunDomain = getEnv('MAILGUN_DOMAIN');
  const isUsingMailgun = mailgunApiKey && mailgunDomain;
  
  if (isUsingMailgun) {
    // console.log('Using Mailgun API');
    return await sendViaMailgun(data);
  }

  // Fall back to SMTP
  const transporter = getTransporter()
  
  if (!transporter) {
    throw new Error('Failed to create email transporter')
  }

  try {
    let html: string | undefined;
    
    // Process HTML from either template or direct input
    if (data.message.template) {
      const templateModule = getEmailTemplate(data.message.template);
      html = templateModule.render(data.message.data || {});

      // // If MJML is enabled, compile the template output
      // if (data.message.mjml && html) {
      //   const { html: mjmlHtml } = mjml2html(html);
      //   html = mjmlHtml;
      // }
    } else if (data.message.html) {
      html = data.message.html;
    }

    const mailDetails = {
      from: data.from,
      to: data.to,
      subject: data.subject,
      ...(data.cc && { cc: data.cc }),
      ...(data.bcc && { bcc: data.bcc }),
      ...(data.replyTo && { replyTo: data.replyTo }),
      // Use provided text, or convert HTML to plain text as fallback
      text: data.message.text || (html ? htmlToPlainText(html) : undefined),
      ...(html && { html }) // Only include html if it exists
    }

    // If sending to multiple recipients, add small delays between batches
    if (Array.isArray(data.to) && data.to.length > 5) {
      const results = [];
      for (let i = 0; i < data.to.length; i += 5) {
        const batch = data.to.slice(i, i + 5);
        const batchDetails = { ...mailDetails, to: batch };
        
        const result = await transporter.sendMail(batchDetails);
        results.push(result);
        
        if (i + 5 < data.to.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return {
        success: true,
        results,
        details: mailDetails
      };
    }

    // Single recipient or small batch
    const result = await transporter.sendMail(mailDetails)
    return {
      success: true,
      messageId: result.messageId,
      details: mailDetails
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: error
    }
  }
}

