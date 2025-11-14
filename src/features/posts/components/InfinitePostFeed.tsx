"use client";

import { useEffect, useRef, useMemo } from "react";
import { PostCard } from "./PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "@/config/icons";
import { EmptyPosts } from "@/components/common";
import type { Post } from "@/types/models";
import { useOptimisticPostStore } from "@/features/posts/stores/optimisticPostStore";

interface InfinitePostFeedProps {
  posts: Post[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  isLoading?: boolean;
  error?: Error | null;
  enableOptimisticUI?: boolean; // Enable merging with optimistic posts
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
  enableOptimisticUI = false,
}: InfinitePostFeedProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticPosts = useOptimisticPostStore((state) => state.optimisticPosts);

  // ✅ Merge optimistic posts with real posts
  const allPosts = useMemo(() => {
    if (!enableOptimisticUI || optimisticPosts.length === 0) {
      return posts;
    }

    // Convert optimistic posts to Post format
    const optimisticAsPosts = optimisticPosts.map((opt) => ({
      id: opt.tempId,
      title: opt.title,
      content: opt.content,
      tags: (opt.tags || []).map((tagName, index) => ({
        id: `temp-tag-${opt.tempId}-${index}`,
        name: tagName,
      })),
      author: opt.author,
      media: opt.media.map((m, mediaIndex) => ({
        id: m.mediaId || `temp-media-${opt.tempId}-${mediaIndex}`,
        url: m.url || m.preview,
        type: 'video' as const,
        thumbnailUrl: null,
      })),
      createdAt: opt.createdAt,
      updatedAt: opt.createdAt,
      commentCount: 0,
      voteCount: 0,
      userVote: null,
      isSaved: false,
      isAuthor: true,
      // Metadata สำหรับแสดงสถานะ
      _isOptimistic: true,
      _optimisticData: {
        tempId: opt.tempId,
        uploadStatus: opt.status,
        uploadProgress: opt.media[0]?.uploadProgress || 0,
        error: opt.media[0]?.error,
      },
    })) as any[];

    // Merge + Sort (optimistic posts ขึ้นก่อน)
    return [...optimisticAsPosts, ...posts].sort((a, b) => {
      if (a._isOptimistic && !b._isOptimistic) return -1;
      if (!a._isOptimistic && b._isOptimistic) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [optimisticPosts, posts, enableOptimisticUI]);

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
          <Card key={i} className="animate-pulse overflow-hidden">
            <CardContent className="p-4">
              {/* Header: Author + Time */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted w-32 mb-2"></div>
                  <div className="h-2 bg-muted w-20"></div>
                </div>
              </div>

              {/* Title */}
              <div className="h-5 bg-muted w-4/5 mb-3"></div>

              {/* Content */}
              <div className="space-y-2 mb-3">
                <div className="h-3 bg-muted w-full"></div>
                <div className="h-3 bg-muted w-5/6"></div>
              </div>
            </CardContent>

            {/* Media Placeholder - Edge-to-Edge */}
            <div className="w-full h-80 bg-muted"></div>

            {/* Actions */}
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="h-8 bg-muted w-20"></div>
                <div className="h-8 bg-muted w-16"></div>
                <div className="h-8 bg-muted w-16"></div>
              </div>
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
  if (!allPosts || allPosts.length === 0) {
    return <EmptyPosts />;
  }

  return (
    <div className="space-y-4">
      {/* Posts */}
      {allPosts.map((post: any) => (
        <PostCard
          key={post.id}
          post={post}
          isOptimistic={post._isOptimistic}
          optimisticData={post._optimisticData}
        />
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
