import { Metadata } from "next";
import { ProfileContent } from "@/features/profile";

// Incremental Static Regeneration - cache 1 ชั่วโมง แล้ว regenerate background
// Profile ไม่ค่อยเปลี่ยน (edit นานๆ ครั้ง) เหมาะกับ ISR
export const revalidate = 3600; // 1 hour

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Generate dynamic metadata for profile page
 * - SEO optimized with username, bio, avatar
 * - Supports OG images for social sharing
 * - Twitter card support
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    // Fetch user profile using native fetch (no auth required for public profiles)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const response = await fetch(`${apiUrl}/users/username/${username}`, {
      next: { revalidate: 3600 }, // ISR cache - sync กับ page revalidate
    });

    if (!response.ok) {
      return {
        title: "ไม่พบโปรไฟล์",
        description: "ไม่พบผู้ใช้ที่คุณกำลังมองหา",
      };
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return {
        title: "ไม่พบโปรไฟล์",
        description: "ไม่พบผู้ใช้ที่คุณกำลังมองหา",
      };
    }

    const user = data.data;

    // Create description from bio
    const description = user.bio
      ? user.bio.substring(0, 160) + (user.bio.length > 160 ? "..." : "")
      : `ดูโปรไฟล์ของ ${user.displayName} บน SUEKK`;

    // Get avatar for OG image
    const ogImage = user.avatar || "/icon-white.svg";

    return {
      title: `${user.displayName} (@${user.username})`,
      description,
      keywords: [user.username, user.displayName, "SUEKK", "โปรไฟล์", "โซเชียลไทย"],
      authors: [{ name: user.displayName }],
      openGraph: {
        title: `${user.displayName} (@${user.username})`,
        description,
        type: "profile",
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/${user.username}`,
        images: [
          {
            url: ogImage,
            width: 400,
            height: 400,
            alt: `${user.displayName}'s avatar`,
          },
        ],
      },
      twitter: {
        card: "summary",
        title: `${user.displayName} (@${user.username})`,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("Error generating profile metadata:", error);
    return {
      title: "โปรไฟล์",
      description: "ดูโปรไฟล์ผู้ใช้ใน SUEKK",
    };
  }
}

export default async function ProfilePage({ params }: PageProps) {
  return <ProfileContent params={params} />;
}
