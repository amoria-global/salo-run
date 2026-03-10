/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL!;
}

export function getLandingUrl(): string {
  return process.env.NEXT_PUBLIC_LANDING_URL!;
}

export function getOldApiUrl(): string {
  return process.env.NEXT_PUBLIC_OLD_API_URL!;
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY!;
}

/** Replace legacy backend IP in image URLs with current API base */
export function normalizeImageUrl(url: string | undefined | null): string | undefined {
  if (!url || url.includes('/null')) return undefined;
  return url.replace(getOldApiUrl(), getApiUrl());
}
