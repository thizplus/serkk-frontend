import { NextResponse } from 'next/server';

/**
 * Dynamic Manifest Route
 *
 * Generates manifest.json dynamically using environment variables
 * This allows getInstalledRelatedApps() API to work properly
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const manifest = {
    name: 'VOOBIZE - โซเชียลไทยแท้',
    short_name: 'VOOBIZE',
    description: 'แพลตฟอร์มโซเชียลมีเดียไทยแท้',
    start_url: '/?v=2',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    // Required for getInstalledRelatedApps() API
    related_applications: [
      {
        platform: 'webapp',
        url: `${appUrl}/manifest.json`,
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
