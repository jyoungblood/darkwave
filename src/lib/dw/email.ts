// DW - Email utility

import nodemailer from 'nodemailer';
// import mjml2html from 'mjml';
import { emailConfig } from '@/config/app';
import { htmlToPlainText } from '@/lib/dw/helpers';
// Singleton transport instance
let mailTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!mailTransporter) {
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
  const transporter = getTransporter()

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

