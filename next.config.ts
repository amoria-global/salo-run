import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);
const isDev = process.env.NODE_ENV !== 'production';

// Allow the configured API origin in connect-src and img-src so browser fetches
// to the backend (especially http://localhost:<port> in dev) aren't blocked by CSP.
const apiOriginHttp = `${apiUrl.protocol}//${apiUrl.host}`;
const apiOriginWs = `${apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiUrl.host}`;

// Dashboard security headers. Slightly tighter than landing since the dashboard
// is authenticated-only — no public unauthenticated surface that loads
// third-party widgets. Adjust CSP after 1 week of report-only observation if
// we enable reporting.
// CSP whitelist for third-party asset hosts the UI was already loading before
// the CSP hardening. Added here (rather than migrating everything self-hosted)
// to avoid reverting feature work:
//   - cdn.jsdelivr.net       — Bootstrap Icons CSS/font (layout.tsx <link>), and
//                              MediaPipe tasks-vision WASM loaded by KYC
//                              verification (KycVerificationModal).
//   - flagcdn.com            — currency flag PNGs in the topbar switcher.
//   - storage.googleapis.com — MediaPipe face-landmarker model downloaded by
//                              KycVerificationModal at verification time.
//   - *.cloudflarestream.com — WHEP HTTP handshake for live-stream preview
//                              playback (StreamPreview + WHEPPlayer).
//   - i.pinimg.com / images.unsplash.com — placeholder client/photo images in
//                              photographer/gallery.tsx (seed/mock data still
//                              rendered on first load before real data arrives).
const cspDirectives = [
  "default-src 'self'",
  // cdn.jsdelivr.net — MediaPipe tasks-vision WASM script loaded by KYC verification flow
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  // cdn.jsdelivr.net — Bootstrap Icons CSS stylesheet (layout.tsx)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  // flagcdn.com           — currency flag PNGs in the topbar switcher
  // i.pinimg.com          — placeholder client avatars in photographer/gallery.tsx
  // images.unsplash.com   — placeholder photo thumbnails in photographer/gallery.tsx
  `img-src 'self' data: blob: ${apiOriginHttp} https://backend.connekyt.com https://*.cloudflarestream.com https://flagcdn.com https://i.pinimg.com https://images.unsplash.com`,
  // cdn.jsdelivr.net — Bootstrap Icons webfont files
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  // cdn.jsdelivr.net        — MediaPipe WASM binary fetched by KYC verification
  // storage.googleapis.com  — MediaPipe face-landmarker model download
  // *.cloudflarestream.com  — WHEP HTTP handshake for live-stream preview playback
  `connect-src 'self' ${apiOriginHttp} ${apiOriginWs} https://backend.connekyt.com https://connekyt.com wss://backend.connekyt.com https://cdn.jsdelivr.net https://storage.googleapis.com https://*.cloudflarestream.com`,
  "media-src 'self' blob: https://*.cloudflarestream.com",
  "frame-src 'self' https://customer-ngk2huwatflljurq.cloudflarestream.com https://*.cloudflarestream.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];
// upgrade-insecure-requests rewrites http:// → https:// which breaks plain
// http://localhost dev backends. Only apply in production.
if (!isDev) cspDirectives.push("upgrade-insecure-requests");

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
    value: cspDirectives.join('; '),
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
