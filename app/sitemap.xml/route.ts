/**
 * Sitemap XML Route
 * Proxy request to backend sitemap endpoint
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/sitemap.xml`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sitemap');
    }

    const sitemap = await response.text();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);

    // Fallback sitemap
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallback, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
