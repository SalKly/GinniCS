/**
 * Server-side utility function to strip HTML tags from a string and return plain text
 * This version is safe for use in Node.js/API routes
 * @param html - The HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlServer(html: string): string {
  if (!html) return "";

  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}
