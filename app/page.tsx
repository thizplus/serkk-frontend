"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { InfinitePostFeed } from "@/features/posts";
import { Button } from "@/components/ui/button";
import { Plus } from "@/config/icons";
import { PAGINATION } from "@/config";
import { useInfinitePosts } from "@/features/posts";

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
    limit: PAGINATION.DEFAULT_LIMIT,
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
      {/* Header with Create Post Button - wrapped with PageWrap */}
      <PageWrap>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">เรื่องชาวบ้าน</h1>
            <p className="text-muted-foreground mt-1">
              เรื่องที่ใครๆก็อยากใส่ใจ
            </p>
          </div>
          <Button onClick={() => router.push("/create-post")}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างโพสต์
          </Button>
        </div>
      </PageWrap>

      {/* Infinite Scroll Post Feed - NO WRAP (edge-to-edge) */}
      <InfinitePostFeed
        posts={posts}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        isLoading={isLoading}
        error={error || null}
        enableOptimisticUI={true}
      />
    </AppLayout>
  );
}
