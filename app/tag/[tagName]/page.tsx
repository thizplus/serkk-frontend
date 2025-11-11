"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Hash, Plus } from "@/config/icons";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfinitePostFeed } from "@/features/posts";
import { useInfinitePostsByTagId } from "@/features/posts";
import { useSearchTags } from "@/features/tags";
import { PAGINATION } from "@/config";

type SortBy = 'hot' | 'new' | 'top';

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  const tagName = decodeURIComponent(params.tagName as string);
  const [sortBy, setSortBy] = useState<SortBy>('hot');

  // ค้นหา tag จากชื่อ (ใช้ search API แทน getByName เพื่อหลีกเลี่ยง URL encoding)
  const {
    data: searchResults,
    isLoading: isLoadingTag,
    error: tagError,
  } = useSearchTags({ q: tagName });

  // หา tag ที่ชื่อตรงกันพอดี (exact match)
  const tagData = searchResults?.tags?.find(
    (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
  );

  // ดึงโพสต์จาก tag ID แบบ infinite scroll
  const {
    data,
    isLoading: isLoadingPosts,
    error: postsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfinitePostsByTagId(tagData?.id || '', {
    sortBy,
    limit: PAGINATION.DEFAULT_LIMIT,
  }, {
    enabled: !!tagData?.id, // ดึงโพสต์ก็ต่อเมื่อได้ tag ID แล้ว
  });

  // Flatten posts from all pages
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data]);

  const isLoading = isLoadingTag || isLoadingPosts;
  const error = tagError || postsError;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `#${tagName}` },
      ]}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          size="sm"
        
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">#{tagName}</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {isLoading
                  ? 'กำลังโหลด...'
                  : `${posts.length.toLocaleString()} โพสต์`}
              </p>
            </div>
          </div>

          {/* Create Post Button */}
          <Button
            onClick={() => router.push(`/create-post?tag=${encodeURIComponent(tagName)}`)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">สร้างโพสต์</span>
          </Button>
        </div>

        {/* Sort Filter */}
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <TabsList>
            <TabsTrigger value="hot">🔥 ร้อนแรง</TabsTrigger>
            <TabsTrigger value="new">🆕 มาใหม่</TabsTrigger>
            <TabsTrigger value="top">⬆️ ยอดนิยม</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Infinite Scroll Posts */}
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
