"use client";

import { useMemo } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/types/models";
import { Loader2 } from "@/config/icons";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
