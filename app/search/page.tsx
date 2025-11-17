"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { InfinitePostFeed } from "@/features/posts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "@/config/icons";
import { useInfiniteSearch } from "@/features/search";
import { LoadingState } from "@/components/common";
import { LOADING_MESSAGES, PAGINATION } from "@/config";

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Sync with URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // ค้นหาจาก API (infinite scroll + cursor pagination)
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteSearch(
    {
      q: searchQuery,
      limit: PAGINATION.DEFAULT_LIMIT,
    },
    {
      enabled: searchQuery.trim().length > 0, // เรียก API เฉพาะเมื่อมีคำค้นหา
    }
  );

  // Flatten posts from all pages
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };


  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: "ค้นหา" },
      ]}
    >
      {/* Search Header + Search Bar - wrapped with PageWrap */}
      <PageWrap>
        <div className="space-y-6">
          {/* Search Header */}
          <div>
            <h1 className="text-3xl font-bold">ค้นหาโพสต์</h1>
            <p className="text-muted-foreground mt-1">
              ค้นหาโพสต์ในชุมชน
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="ค้นหาโพสต์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              ค้นหา
            </Button>
          </form>

          {/* Results count */}
          {!isLoading && !error && searchQuery.trim() && posts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              พบ {posts.length} โพสต์{hasNextPage && '+'}
            </p>
          )}

          {/* Initial State - ยังไม่ได้ค้นหา */}
          {!searchQuery.trim() && (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">เริ่มค้นหา</h3>
                <p className="text-muted-foreground">
                  พิมพ์คำค้นหาในช่องด้านบนเพื่อค้นหาโพสต์
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrap>

      {/* Post Feed - NO WRAP (edge-to-edge) - Infinite Scroll + Virtualized */}
      {searchQuery.trim() && (
        <InfinitePostFeed
          posts={posts}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          isLoading={isLoading}
          error={error || null}
        />
      )}
    </AppLayout>
  );
}

// Wrap with Suspense to handle useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "ค้นหา" },
        ]}
      >
        <PageWrap>
          <LoadingState message={LOADING_MESSAGES.SEARCH.LOADING} />
        </PageWrap>
      </AppLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
