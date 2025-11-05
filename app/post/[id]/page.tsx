import { Metadata } from "next";
import { PostDetailContent } from "./PostDetailContent";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
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
      cache: 'no-store',
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
      : "อ่านโพสต์เพิ่มเติมใน VOOBIZE";

    // Get first image for OG image
    const ogImage = post.media && post.media.length > 0 && post.media[0].type === 'image'
      ? post.media[0].url
      : "/logo.png";

    // Get tags for keywords
    const keywords = post.tags?.map((tag: { id: string; name: string }) => tag.name) || [];

    return {
      title: post.title,
      description,
      keywords: [...keywords, "VOOBIZE", "โซเชียลไทย"],
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
      description: "อ่านโพสต์ใน VOOBIZE",
    };
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PostDetailContent postId={id} />;
}
