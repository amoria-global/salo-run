import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs/config';
import { execSync } from 'node:child_process';

// The release Sentry files every error under: the commit being built, read from git, so no variable has to be set by
// hand. Outside a git checkout it is simply absent. SENTRY_RELEASE overrides it for a test build.
function gitSha(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || undefined;
  } catch {
    return undefined;
  }
}
const release = process.env.SENTRY_RELEASE || gitSha();

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);
const isDev = process.env.NODE_ENV !== 'production';

// Allow the configured API origin in connect-src and img-src so browser fetches
// to the backend (especially http://localhost:<port> in dev) aren't blocked by CSP.
const apiOriginHttp = `${apiUrl.protocol}//${apiUrl.host}`;
const apiOriginWs = `${apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiUrl.host}`;

// Dashboard security headers. Slightly tighter than landing since the dashboard
// is authenticated-only, so no public unauthenticated surface loads
// third-party widgets. Adjust CSP after 1 week of report-only observation if
// we enable reporting.
// CSP whitelist for third-party asset hosts the UI was already loading before
// the CSP hardening. Added here (rather than migrating everything self-hosted)
// to avoid reverting feature work:
//   * cdn.jsdelivr.net       : Bootstrap Icons CSS/font (layout.tsx <link>), and
//                              MediaPipe tasks-vision WASM loaded by KYC
//                              verification (KycVerificationModal).
//   * flagcdn.com            : currency flag PNGs in the topbar switcher.
//   * storage.googleapis.com : MediaPipe face-landmarker model downloaded by
//                              KycVerificationModal at verification time.
//   * *.cloudflarestream.com : WHEP HTTP handshake for live-stream preview
//                              playback (StreamPreview + WHEPPlayer).
//   * i.pinimg.com / images.unsplash.com : placeholder client/photo images in
//                              photographer/gallery.tsx (seed/mock data still
//                              rendered on first load before real data arrives).
const cspDirectives = [
  "default-src 'self'",
  // cdn.jsdelivr.net: MediaPipe tasks-vision WASM script loaded by KYC verification flow
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  // cdn.jsdelivr.net: Bootstrap Icons CSS stylesheet (layout.tsx)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  // flagcdn.com:          currency flag PNGs in the topbar switcher
  // i.pinimg.com:         placeholder client avatars in photographer/gallery.tsx
  // images.unsplash.com:  placeholder photo thumbnails in photographer/gallery.tsx
  // *.r2.cloudflarestorage.com: media now lives in Cloudflare R2. When a file
  // is not on the local disk the backend 302-redirects /uploads/** to a
  // presigned R2 URL, so the browser's final image request lands on the R2
  // endpoint - it must be allowed or every R2-served photo renders broken.
  `img-src 'self' data: blob: ${apiOriginHttp} https://backend.connekyt.com https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com https://flagcdn.com https://i.pinimg.com https://images.unsplash.com`,
  // cdn.jsdelivr.net: Bootstrap Icons webfont files
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
  // cdn.jsdelivr.net:        MediaPipe WASM binary fetched by KYC verification
  // storage.googleapis.com:  MediaPipe face-landmarker model download
  // *.cloudflarestream.com:  WHEP HTTP handshake for live-stream preview playback
  `connect-src 'self' ${apiOriginHttp} ${apiOriginWs} https://backend.connekyt.com https://connekyt.com wss://backend.connekyt.com https://cdn.jsdelivr.net https://storage.googleapis.com https://*.cloudflarestream.com`,
  // *.r2.cloudflarestorage.com: videos in R2 are 302-redirected from /uploads/**
  // to a presigned R2 URL (R2 serves the Range request), same as img-src above.
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com",
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
  // Lets the plain error sender (app/lib/errors/sentrySink.ts) tag its events with the same release as the SDK's.
  ...(release ? { env: { NEXT_PUBLIC_SENTRY_RELEASE: release } } : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'backend.connekyt.com' },
      // next/image's optimizer follows the backend's /uploads/** 302 to a
      // presigned R2 URL server-side and validates the FINAL host against this
      // list - without R2 here, every R2-served photo fails optimization.
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
      },
    ],
  },
  // The User role was merged into Client, and every /user/user page had a
  // /user/client twin. Old bookmarks and links keep working.
  async redirects() {
    return [
      { source: '/user/user', destination: '/user/client/home', permanent: false },
      { source: '/user/user/:path*', destination: '/user/client/:path*', permanent: false },
    ];
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

// Source maps are only produced when they can be uploaded and removed again. The Sentry plugin turns browser source
// maps on, and unless it deletes them after upload they would be served to every visitor, so without an auth token
// (local builds, CI) the plugin is not applied at all and no maps exist.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: 'amoria-global-tech',
      project: 'connekyt-dashboard',
      sentryUrl: 'https://de.sentry.io/',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      telemetry: false,
      widenClientFileUpload: true,
      release: release ? { name: release } : undefined,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : nextConfig;
