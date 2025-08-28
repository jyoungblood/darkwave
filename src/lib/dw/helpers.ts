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
  return text?.toLowerCase().replace(/\s+/g, '-') ?? '';
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
export function nl2br(text: string): string {
  return text.replace(/\n/g, '<br>');
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