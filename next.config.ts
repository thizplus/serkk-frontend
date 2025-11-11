import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Cloudflare R2 (New)
      {
        protocol: 'https',
        hostname: 'pub-a058b390b77f486aaf97a1d1f073c6c8.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Bunny CDN (Legacy - for old images)
      {
        protocol: 'https',
        hostname: 'voobizethailand.b-cdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vz-b1631ae0-4c8.b-cdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
