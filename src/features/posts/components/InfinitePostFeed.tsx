"use client";

import { VirtualizedPostFeed } from './VirtualizedPostFeed';
import { Card, CardContent } from "@/components/ui/card";
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
  enableOptimisticUI?: boolean;
}

/**
 * InfinitePostFeed Component - Virtualized Version
 *
 * Wrapper around VirtualizedPostFeed to maintain backward compatibility
 * - ✅ Same interface as before (drop-in replacement)
 * - ✅ Uses react-virtuoso for performance
 * - ✅ Handles loading/error/empty states
 *
 * Phase 1: Home Feed POC
 * - เก็บ metrics Before/After (DOM, FPS, Memory)
 * - ทดสอบ Optimistic Posts (upload/success/fail+retry)
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
  const optimisticPosts = useOptimisticPostStore((state) => state.optimisticPosts);

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

  // Empty state (ไม่นับ optimistic posts)
  if (!posts || posts.length === 0) {
    return <EmptyPosts />;
  }

  // ✅ Use VirtualizedPostFeed for rendering
  return (
    <VirtualizedPostFeed
      posts={posts}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      enableOptimisticUI={enableOptimisticUI}
    />
  );
}
