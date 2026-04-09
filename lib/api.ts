/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL as string;
}

export function getLandingUrl(): string {
  return process.env.NEXT_PUBLIC_LANDING_URL as string;
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY as string;
}

/**
 * Auto-capitalize: uppercase first letter of each sentence and after full stops.
 * Also capitalizes the first letter of the entire string.
 */
export function autoCapitalize(text: string): string {
  if (!text) return text;
  // Capitalize first letter
  let result = text.charAt(0).toUpperCase() + text.slice(1);
  // Capitalize after ". " (full stop + space)
  result = result.replace(/\.\s+([a-z])/g, (match, letter) => match.replace(letter, letter.toUpperCase()));
  return result;
}

/**
 * Auto-capitalize each word (for names, titles, locations).
 */
export function capitalizeWords(text: string): string {
  if (!text) return text;
  return text.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url.includes('/null')) return undefined;
  const OLD_IP = 'http://197.243.24.101';
  if (url.startsWith(OLD_IP)) return url.replace(OLD_IP, getApiUrl());
  return url;
}
