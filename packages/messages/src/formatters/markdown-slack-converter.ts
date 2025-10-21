/**
 * Markdown to Slack mrkdwn Converter
 * Converts standard Markdown (Telegram-style) formatting to Slack's mrkdwn format
 *
 * Conversions:
 * - **bold** → *bold*
 * - __underline__ → _italic_ (Slack doesn't support underline, using italic as closest match)
 * - [text](url) → <url|text>
 */

/**
 * Convert Markdown text to Slack mrkdwn format
 * @param text Text with Markdown formatting
 * @returns Text with Slack mrkdwn formatting
 *
 * @example
 * convertMarkdownToSlack('**Bold** text')
 * // Returns: '*Bold* text'
 *
 * @example
 * convertMarkdownToSlack('[Click here](https://example.com)')
 * // Returns: '<https://example.com|Click here>'
 *
 * @example
 * convertMarkdownToSlack('**Bold** with [link](https://example.com)')
 * // Returns: '*Bold* with <https://example.com|link>'
 */
export function convertMarkdownToSlack(text: string): string {
  return text
    // Convert [text](url) links to <url|text> format (must be done first to avoid interfering with bold/italic)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
    // Convert **bold** to *bold*
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')
    // Convert __underline__ to _italic_ (Slack doesn't have underline)
    .replace(/__([^_]+)__/g, '_$1_');
}
