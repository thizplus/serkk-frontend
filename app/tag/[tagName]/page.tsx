import { Metadata } from "next";
import TagPageContent from "./TagPageContent";

interface PageProps {
  params: Promise<{
    tagName: string;
  }>;
}

/**
 * Generate dynamic metadata for tag page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tagName } = await params;
  const decodedTagName = decodeURIComponent(tagName);

  return {
    title: `#${decodedTagName}`,
    description: `ดูโพสต์ทั้งหมดเกี่ยวกับ #${decodedTagName} ใน SUEKK`,
    keywords: [decodedTagName, "tag", "SUEKK", "โซเชียลไทย"],
    openGraph: {
      title: `#${decodedTagName} | SUEKK`,
      description: `ดูโพสต์ทั้งหมดเกี่ยวกับ #${decodedTagName}`,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/tag/${tagName}`,
    },
    twitter: {
      card: "summary",
      title: `#${decodedTagName} | SUEKK`,
      description: `ดูโพสต์ทั้งหมดเกี่ยวกับ #${decodedTagName}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tagName } = await params;
  const decodedTagName = decodeURIComponent(tagName);

  return <TagPageContent tagName={decodedTagName} />;
}
