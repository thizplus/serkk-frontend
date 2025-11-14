import { Metadata } from "next";
import { PostDetailContent } from "./PostDetailContent";

// Incremental Static Regeneration - cache 5 นาที แล้ว regenerate background
export const revalidate = 300; // 5 minutes

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  media?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Generate dynamic metadata for post detail page
 * - Auto-generates title, description from post data
 * - Supports OG images, Twitter cards
 * - SEO optimized
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch post data using native fetch (no auth required for public posts)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const response = await fetch(`${apiUrl}/posts/${id}`, {
      next: { revalidate: 300 }, // ISR cache - sync กับ page revalidate
    });

    if (!response.ok) {
      return {
        title: "ไม่พบโพสต์",
        description: "ไม่พบโพสต์ที่คุณกำลังมองหา",
      };
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return {
        title: "ไม่พบโพสต์",
        description: "ไม่พบโพสต์ที่คุณกำลังมองหา",
      };
    }

    const post = data.data;

    // Create description from content (max 160 chars)
    const description = post.content
      ? post.content.substring(0, 160) + (post.content.length > 160 ? "..." : "")
      : "อ่านโพสต์เพิ่มเติมใน SUEKK";

    // Get first image for OG image
    const ogImage = post.media && post.media.length > 0 && post.media[0].type === 'image'
      ? post.media[0].url
      : "/icon-white.svg";

    // Get tags for keywords
    const keywords = post.tags?.map((tag: { id: string; name: string }) => tag.name) || [];

    return {
      title: post.title,
      description,
      keywords: [...keywords, "SUEKK", "โซเชียลไทย"],
      authors: [{ name: post.author.displayName }],
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.createdAt,
        modifiedTime: post.updatedAt,
        authors: [post.author.displayName],
        tags: keywords,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: [ogImage],
        creator: `@${post.author.username}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "โพสต์",
      description: "อ่านโพสต์ใน SUEKK",
    };
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch post data for JSON-LD
  let jsonLd = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/posts/${id}`, {
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const post: Post = data.data;

        // Generate JSON-LD structured data
        jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.content?.substring(0, 160) || '',
          image: post.media && post.media.length > 0 && post.media[0].type === 'image'
            ? post.media[0].url
            : `${appUrl}/icon-white.svg`,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
          author: {
            '@type': 'Person',
            name: post.author.displayName,
            url: `${appUrl}/profile/${post.author.username}`,
            image: post.author.avatar,
          },
          publisher: {
            '@type': 'Organization',
            name: 'SUEKK',
            logo: {
              '@type': 'ImageObject',
              url: `${appUrl}/icon-white.svg`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${appUrl}/post/${post.id}`,
          },
          keywords: post.tags?.map(tag => tag.name).join(', ') || '',
        };
      }
    }
  } catch (error) {
    console.error('Error generating JSON-LD:', error);
  }

  return <PostDetailContent postId={id} jsonLd={jsonLd} />;
}
