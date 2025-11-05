"use client";

import { useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Post } from "@/lib/types/models";

interface InfinitePostFeedProps {
  posts: Post[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * InfinitePostFeed Component
 *
 * ใช้ IntersectionObserver สำหรับ infinite scroll ที่ smooth และ performant
 * - Load ahead strategy: เริ่ม load ก่อนถึงล่างสุด 500px
 * - Debouncing: ป้องกัน spam requests
 * - Skeleton loading: แสดง placeholder ขณะโหลด
 */
export function InfinitePostFeed({
  posts,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading,
  error,
}: InfinitePostFeedProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer สำหรับ detect scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        // เมื่อ scroll เข้าใกล้ load more trigger (load ahead strategy)
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          // Debounce: รอ 100ms ก่อน fetch (ป้องกัน spam)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            fetchNextPage();
          }, 100);
        }
      },
      {
        // Load ahead: เริ่ม load เมื่ออยู่ห่างจากล่างสุด 500px
        rootMargin: '500px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-8">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-muted-foreground">
            {error.message || 'ไม่สามารถโหลดโพสต์ได้'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <h3 className="text-lg font-semibold mb-2">ไม่มีโพสต์</h3>
          <p className="text-muted-foreground">
            ยังไม่มีโพสต์ในขณะนี้
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load More Trigger (IntersectionObserver target) */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">กำลังโหลดเพิ่มเติม...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
