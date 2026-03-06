/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL as string;
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY as string;
}
