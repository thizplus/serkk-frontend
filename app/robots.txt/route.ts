/**
 * Robots.txt Route
 * Proxy request to backend robots.txt endpoint
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/robots.txt`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch robots.txt');
    }

    const robots = await response.text();

    return new Response(robots, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching robots.txt:', error);

    // Fallback robots.txt
    const fallback = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sitemap.xml`;

    return new Response(fallback, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
