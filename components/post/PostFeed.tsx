"use client";

import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types/models";
import { Loader2 } from "lucide-react";

interface PostFeedProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function PostFeed({
  posts,
  isLoading = false,
  emptyMessage = "ยังไม่มีโพสต์ในขณะนี้"
}: PostFeedProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
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
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
        />
      ))}
    </div>
  );
}
