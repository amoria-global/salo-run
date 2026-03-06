/**
 * Shared API configuration utilities
 */

export function getApiUrl(): string {
  // In production (Vercel), use the proxy to avoid mixed content / CORS issues
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://backend.connekyt.com';
}

export function getApiKey(): string {
  return process.env.NEXT_PUBLIC_API_KEY || '';
}
