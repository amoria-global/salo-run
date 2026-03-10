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

export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url.includes('/null')) return undefined;
  const OLD_IP = 'http://197.243.24.101';
  if (url.startsWith(OLD_IP)) return url.replace(OLD_IP, getApiUrl());
  return url;
}
