// DW - Email utility

import nodemailer from 'nodemailer';
// import mjml2html from 'mjml';
import { emailConfig } from '@/config/app';
import { htmlToPlainText } from '@/lib/dw/helpers';
// Singleton transport instance
let mailTransporter: nodemailer.Transporter | null = null;

// Mailgun API function
async function sendViaMailgun(data: EmailData) {
  const mailgunApiKey = import.meta.env.MAILGUN_API_KEY;
  const mailgunDomain = import.meta.env.MAILGUN_DOMAIN;
  
  if (!mailgunApiKey || !mailgunDomain) {
    throw new Error('Mailgun credentials not configured');
  }

  let html: string | undefined;
  
  // Process HTML from either template or direct input (same logic as SMTP version)
  if (data.message.template) {
    // Dynamically import the template with vite-ignore comment
    let templatePath = data.message.template;
    
    // Handle @/ alias
    if (templatePath.startsWith('@/')) {
      // just use '@' to mean 'src' and reference two levels up from this file
      templatePath = templatePath.replace('@/', '../../');
    }
    // Handle paths starting with ./src/ or src/
    else if (templatePath.startsWith('./src/') || templatePath.startsWith('src/')) {
      templatePath = templatePath.replace(/^\.?\/?src\//, '../');
    }

    // Add .tsx extension if no extension is provided
    if (!templatePath.match(/\.[^.]+$/)) {
      templatePath += '.tsx';
    }
    
    const templateModule = await import(/* @vite-ignore */ templatePath);
    html = await templateModule.render(data.message.data || {});
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
  const mailgunApiKey = import.meta.env.MAILGUN_API_KEY;
  const mailgunDomain = import.meta.env.MAILGUN_DOMAIN;
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
      // Dynamically import the template with vite-ignore comment
      let templatePath = data.message.template;
      
      // Handle @/ alias
      if (templatePath.startsWith('@/')) {
        // just use '@' to mean 'src' and reference two levels up from this file
        templatePath = templatePath.replace('@/', '../../');
      }
      // Handle paths starting with ./src/ or src/
      else if (templatePath.startsWith('./src/') || templatePath.startsWith('src/')) {
        templatePath = templatePath.replace(/^\.?\/?src\//, '../');
      }

      // Add .tsx extension if no extension is provided
      if (!templatePath.match(/\.[^.]+$/)) {
        templatePath += '.tsx';
      }
      
      const templateModule = await import(/* @vite-ignore */ templatePath);
      html = await templateModule.render(data.message.data || {});

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

