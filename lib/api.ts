/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}
