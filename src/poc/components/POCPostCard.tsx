"use client";

import { PostCard } from "@/features/posts";
import type { Post } from "@/types/models";
import { convertPostMediaToMediaItems, postHasMedia } from "../utils/mediaAdapter";

interface POCPostCardProps {
  post: Post;
  onMediaClick: (post: Post, media: any[], initialIndex?: number) => void;
  onCommentClick: (post: Post) => void;
}

/**
 * POC PostCard Wrapper
 *
 * Wraps the original PostCard to intercept:
 * - Media clicks → open media viewer
 * - Comment button clicks → open comment drawer
 */
export function POCPostCard({ post, onMediaClick, onCommentClick }: POCPostCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if click is on media (not on buttons/links)
    const isMediaClick =
      target.tagName === 'IMG' ||
      target.tagName === 'VIDEO' ||
      target.closest('[data-media-container]');

    if (isMediaClick && postHasMedia(post.media)) {
      e.preventDefault();
      e.stopPropagation();

      const mediaItems = convertPostMediaToMediaItems(post.media);
      onMediaClick(post, mediaItems, 0);
    }
  };

  const handleCommentClickOverride = () => {
    onCommentClick(post);
  };

  return (
    <div onClick={handleCardClick}>
      <PostCard
        post={post}
        disableNavigation={false}
        onCommentClick={handleCommentClickOverride}
      />
    </div>
  );
}
