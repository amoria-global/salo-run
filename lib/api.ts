/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  // In production, the server reverse-proxies /api/* to the backend directly
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '';
  }
  return 'https://backend.connekyt.com';
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}
