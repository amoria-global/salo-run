/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL!;
}

export function getLandingUrl(): string {
  return process.env.NEXT_PUBLIC_LANDING_URL!;
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY!;
}
