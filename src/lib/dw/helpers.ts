// DW - Misc utility functions

/**
 * Formats a date string to MM/DD/YY format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "1/28/25")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  });
}

/**
 * Formats a date string to MySQL format (YYYY-MM-DD HH:MM:SS)
 * @param dateStr ISO date string or Date object
 * @returns Formatted date string (e.g., "2025-03-27 12:00:00")
 */

// EX
// formatMySQLDateTime() // Uses current date/time
// formatMySQLDateTime(new Date()) // With Date object
// formatMySQLDateTime("2024-03-27") // With date string

export function formatMySQLDateTime(dateStr?: string | Date): string {
  const date = dateStr ? (typeof dateStr === 'string' ? new Date(dateStr) : dateStr) : new Date();
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
  * Formats a string to a slug
  * @param text String to format
  * @returns Slugified string (e.g., "my-string")
 */
export function formatSlug(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove all non-alphanumeric characters (keep spaces)
    .replace(/\s+/g, '-'); // Replace spaces with dashes
}

/**
 * Formats a FormDataEntryValue to a string or null
 * @param value FormDataEntryValue to format
 * @returns Formatted string or null
 */
export function formatString(value: FormDataEntryValue | null): string | null {
  return value?.toString() || null;
}

/**
 * Converts HTML to readable plain text
 * @param html HTML string
 * @returns Plain text string
 */
export function htmlToPlainText(html: string): string {
  return html
    // Remove HTML tags but preserve line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines to 2
}

/**
 * Converts newlines to HTML <br> tags (equivalent to PHP's nl2br)
 * @param text Text string with newlines
 * @returns HTML string with <br> tags
 */
export function nl2br(text: string | null | undefined): string {
  return text?.replace(/\n/g, '<br>') || '';
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports: watch URLs, embed URLs, short URLs, and more
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle various YouTube URL formats
  const patterns = [
    // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    // YouTube Music URLs: https://music.youtube.com/watch?v=VIDEO_ID
    /(?:music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
    // YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}









/**
 * Normalizes a URL string by ensuring it has a protocol scheme
 * @param url URL string to normalize (may or may not include protocol)
 * @param protocol Optional protocol to use ('http://' or 'https://'). Defaults to 'https://'
 * @returns Normalized URL with protocol, or empty string if URL is invalid/empty or doesn't contain a dot
 */
export function normalizeUrl(url: string, protocol?: 'http://' | 'https://'): string {
  if (!url || url === '' || url.indexOf('.') === -1) {
    return '';
  }

  let normalized = url.trim();
  const hasScheme = /^https?:\/\//i.test(normalized);
  const desiredProtocol = protocol ?? 'https://';

  if (!hasScheme) {
    // Handle cases like //example.com to avoid duplicating slashes
    if (normalized.indexOf('//') !== -1) {
      const parts = normalized.split('//');
      normalized = parts[1] ?? normalized;
    }
    return `${desiredProtocol}${normalized}`;
  }

  // Already has http/https; rewrite scheme if a specific protocol is requested
  if (protocol) {
    const parts = normalized.split('//');
    const rest = parts[1] ?? '';
    return `${desiredProtocol}${rest}`;
  }

  return normalized;
}





/**
  * Cleans HTML text by removing tags and collapsing whitespace
  * @param input String to clean
  * @returns Cleaned string or null
 */
export function cleanHtmlText(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const withoutTags = input.replace(/<[^>]*>/g, " ");
  const collapsedWhitespace = withoutTags.replace(/\s+/g, " ").trim();
  return collapsedWhitespace;
}







/**
 * Escapes XML special characters in a string
 * @param unsafe The string to escape
 * @returns The escaped string
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}