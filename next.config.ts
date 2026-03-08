import type { NextConfig } from "next";

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
        protocol: 'https',
        hostname: 'backend.connekyt.com',
      },
      {
        // TODO: Remove once DevOps sets base-url=https://backend.connekyt.com in production application.properties
        protocol: 'http',
        hostname: '197.243.24.101',
      },
    ],
  },
};

export default nextConfig;
