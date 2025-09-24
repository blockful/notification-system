/**
 * Placeholder utilities for message templating
 */

export interface PlaceholderMap {
  [key: string]: string | number | undefined;
}

/**
 * Replace placeholders in a message template
 * @param template - The message template with {{placeholders}}
 * @param values - Object with placeholder values
 * @returns The message with placeholders replaced
 */
export function replacePlaceholders(template: string, values: PlaceholderMap): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key]?.toString() ?? match;
  });
}