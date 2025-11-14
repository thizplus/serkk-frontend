import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: APP_URL,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1.0,
      },
      {
        url: `${APP_URL}/search`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${APP_URL}/login`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${APP_URL}/register`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    ];

    // Fetch recent posts (limit 1000 for performance)
    let postPages: MetadataRoute.Sitemap = [];
    try {
      const postsResponse = await fetch(`${API_URL}/posts?sortBy=new&limit=1000`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        if (postsData.success && postsData.data?.posts) {
          postPages = postsData.data.posts.map((post: any) => ({
            url: `${APP_URL}/post/${post.id}`,
            lastModified: new Date(post.updatedAt || post.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching posts for sitemap:', error);
    }

    // Fetch popular tags (limit 100)
    let tagPages: MetadataRoute.Sitemap = [];
    try {
      const tagsResponse = await fetch(`${API_URL}/tags/popular?limit=100`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        if (tagsData.success && tagsData.data?.tags) {
          tagPages = tagsData.data.tags.map((tag: any) => ({
            url: `${APP_URL}/tag/${encodeURIComponent(tag.name)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching tags for sitemap:', error);
    }

    // Note: We don't include user profiles in sitemap for privacy
    // Users can still be crawled via links from their posts

    return [...staticPages, ...postPages, ...tagPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if dynamic fetching fails
    return [
      {
        url: APP_URL,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 1.0,
      },
    ];
  }
}
