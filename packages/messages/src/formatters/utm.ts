/**
 * UTM tracking parameter utilities
 * Appends UTM params to URLs for tracking notification engagement
 */

export interface UtmParams {
  source: string; // "Notification"
  medium: string; // Consumer
  campaign: string; // Trigger type
}

/**
 * Appends UTM tracking parameters to a URL
 * Handles both URLs with and without existing query parameters
 */
export function appendUtmParams(url: string, params: UtmParams): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=${params.source}&utm_medium=${params.medium}&utm_campaign=${params.campaign}`;
}
