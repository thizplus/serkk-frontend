"use client";

import { useMemo } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/types/models";
import { Loader2 } from "@/config/icons";
import { Card, CardContent } from "@/components/ui/card";
import { useOptimisticPostStore } from "@/features/posts/stores/optimisticPostStore";

interface PostFeedProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
  enableOptimisticUI?: boolean; // Enable merging with optimistic posts
}

export function PostFeed({
  posts,
  isLoading = false,
  emptyMessage = "ยังไม่มีโพสต์ในขณะนี้",
  enableOptimisticUI = false
}: PostFeedProps) {
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

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          ลองสร้างโพสต์แรกของคุณสิ!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post: any) => (
        <PostCard
          key={post.id}
          post={post}
          isOptimistic={post._isOptimistic}
          optimisticData={post._optimisticData}
        />
      ))}
    </div>
  );
}
