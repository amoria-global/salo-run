import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);

// Dashboard security headers. Slightly tighter than landing since the dashboard
// is authenticated-only — no public unauthenticated surface that loads
// third-party widgets. Adjust CSP after 1 week of report-only observation if
// we enable reporting.
const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://backend.connekyt.com https://*.cloudflarestream.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://backend.connekyt.com https://connekyt.com wss://backend.connekyt.com",
      "media-src 'self' blob: https://*.cloudflarestream.com",
      "frame-src 'self' https://customer-ngk2huwatflljurq.cloudflarestream.com https://*.cloudflarestream.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'backend.connekyt.com' },
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
