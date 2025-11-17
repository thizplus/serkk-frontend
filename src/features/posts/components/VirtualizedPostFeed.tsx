"use client";

import { Virtuoso } from 'react-virtuoso';
import { PostCard } from './PostCard';
import { OptimisticPostCard } from './OptimisticPostCard';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "@/config/icons";
import type { Post } from '@/types/models';
import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';

interface VirtualizedPostFeedProps {
  posts: Post[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  enableOptimisticUI?: boolean;
}

/**
 * VirtualizedPostFeed Component
 *
 * ใช้ react-virtuoso เพื่อ virtualize feed → ลด DOM nodes
 * - ✅ แสดงแค่โพสต์ใน viewport + buffer (overscan)
 * - ✅ Optimistic posts แสดงด้านบนสุด (นอก Virtuoso)
 * - ✅ Infinite scroll with React Query
 * - ✅ Window scroll (ไม่ใช่ container scroll)
 *
 * Expert Recommendations:
 * - Start with low overscan (2-5)
 * - Don't use defaultItemHeight initially (layout already predictable)
 * - Accept scroll position loss on refresh (simple approach)
 */
export function VirtualizedPostFeed({
  posts,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  enableOptimisticUI = false,
}: VirtualizedPostFeedProps) {
  const optimisticPosts = useOptimisticPostStore((state) => state.optimisticPosts);

  return (
    <div className="space-y-4">
      {/* ✅ Optimistic Posts - นอก Virtuoso (แสดงด้านบนสุดเสมอ) */}
      {enableOptimisticUI && optimisticPosts.length > 0 && (
        <>
          {optimisticPosts.map((optimisticPost) => (
            <OptimisticPostCard key={optimisticPost.tempId} tempId={optimisticPost.tempId} />
          ))}
        </>
      )}

      {/* ✅ Real Posts - Virtualized */}
      <Virtuoso
        data={posts}
        useWindowScroll  // ✅ ใช้ window scroll แทน container scroll
        overscan={2}     // ✅ เริ่มต่ำก่อน (render 2 items นอก viewport)
        itemContent={(_, post) => (
          <div className="mb-4">
            <PostCard post={post} />
          </div>
        )}
        components={{
          // Loading indicator ตอนโหลดเพิ่ม
          Footer: () => {
            if (!hasNextPage) return null;
            return isFetchingNextPage ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">กำลังโหลดเพิ่มเติม...</p>
                </CardContent>
              </Card>
            ) : null;
          },
        }}
        endReached={() => {
          // ✅ เรียก fetchNextPage เมื่อ scroll ใกล้ล่างสุด
          if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
          }
        }}
      />
    </div>
  );
}
