import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);
const oldApiUrl = new URL(process.env.NEXT_PUBLIC_OLD_API_URL!);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
      },
      {
        protocol: oldApiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: oldApiUrl.hostname,
      },
    ],
  },
};

export default nextConfig;
