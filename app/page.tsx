"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { InfinitePostFeed } from "@/components/post/InfinitePostFeed";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useInfinitePosts } from "@/lib/hooks/queries/usePosts";

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();

  // Infinite scroll query
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfinitePosts({
    sortBy: 'hot',
    limit: 20,
  });

  // Flatten posts from all pages
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data]);

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก" },
      ]}
    >
      <div className="space-y-6">
        {/* Header with Create Post Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ฟีดโพสต์</h1>
            <p className="text-muted-foreground mt-1">
              ค้นพบและแบ่งปันเรื่องราวจากชุมชน
            </p>
          </div>
          <Button onClick={() => router.push("/create-post")}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างโพสต์
          </Button>
        </div>

        {/* Infinite Scroll Post Feed */}
        <InfinitePostFeed
          posts={posts}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          isLoading={isLoading}
          error={error || null}
        />
      </div>
    </AppLayout>
  );
}
