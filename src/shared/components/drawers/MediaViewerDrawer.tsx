"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { VoteButtons } from "@/features/posts/components/VoteButtons";
import { CommentForm } from "@/features/comments/components/CommentForm";
import { CommentTree } from "@/features/comments/components/CommentTree";
import { useToggleVote } from "@/features/posts/hooks/useVotes";
import { usePost } from "@/features/posts/hooks/usePosts";
import { useCommentTree, useCreateComment, useUpdateComment, useDeleteComment } from "@/features/comments";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";
import { LinkifiedContent } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import type { Post, CommentWithReplies } from "@/types/models";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

interface MediaViewerDrawerProps {
  media: MediaItem[];
  post: Post;
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
}

/**
 * MediaViewerDrawer - Production Media Viewer with Full Interactions
 *
 * Features:
 * - Vertical scroll media gallery
 * - Vote buttons
 * - Comment form + nested comment tree
 * - Swipe down to dismiss
 * - Full-screen (100vh)
 *
 * Migrated from POC5_Drawer
 */
export function MediaViewerDrawer({
  media,
  post,
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerDrawerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Hooks
  const { handleVote } = useToggleVote();
  // ✅ Fetch realtime post data from React Query cache
  const { data: livePost } = usePost(post.id);
  const currentPost = livePost || post; // Fallback to props if not loaded yet

  const { data: comments = [], refetch: refetchComments } = useCommentTree(post.id, {
    maxDepth: 10,
  });
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  // Format time
  const timeAgo = formatDistanceToNow(new Date(currentPost.createdAt), {
    addSuffix: true,
    locale: th
  });

  // Scroll to initial index when opening
  useEffect(() => {
    if (open && scrollContainerRef.current && initialIndex > 0) {
      const firstMedia = scrollContainerRef.current.querySelector(`[data-index="${initialIndex}"]`);
      if (firstMedia) {
        firstMedia.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [open, initialIndex]);

  // Handlers
  const handleVoteClick = (vote: 'up' | 'down') => {
    handleVote(currentPost.id, 'post', vote, currentPost.userVote);
  };

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    try {
      await createComment.mutateAsync({
        postId: post.id,
        content,
        parentId: parentId || undefined,
      });
      // Refetch comments after successful creation
      await refetchComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleCommentVote = (commentId: string, vote: 'up' | 'down') => {
    // Recursive search for comment in tree structure
    const findComment = (
      comments: CommentWithReplies[],
      id: string
    ): CommentWithReplies | null => {
      for (const comment of comments) {
        if (comment.id === id) return comment;
        if (comment.replies && comment.replies.length > 0) {
          const found = findComment(comment.replies, id);
          if (found) return found;
        }
      }
      return null;
    };

    const comment = findComment(comments, commentId);
    const currentUserVote = comment?.userVote || null;

    handleVote(commentId, 'comment', vote, currentUserVote);
  };

  const handleReply = (commentId: string) => {
    // Reply functionality is handled by CommentCard internally
    console.log('Reply to comment:', commentId);
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      await updateComment.mutateAsync({
        id: commentId,
        data: { content: newContent }
      });
      // Refetch comments after successful edit
      await refetchComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      // Refetch comments after successful deletion
      await refetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="h-screen data-[vaul-drawer-direction=bottom]:max-h-[95vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Media Viewer</DrawerTitle>
        </DrawerHeader>

        {/* Vertical Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Media Section - Edge-to-Edge */}
          <div className="space-y-4 py-4">
            {media.map((item, index) => (
              <div
                key={item.id}
                data-index={index}
                className="w-full relative"
              >
                {/* Media Content - Natural Loading (No Skeleton) */}
                {item.type === 'video' ? (
                  <video
                    poster={item.thumbnail}
                    controls
                    playsInline
                    className="w-full max-h-[85vh] object-contain bg-black"
                  >
                    <source src={item.url} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full object-contain bg-black"
                    loading={index === initialIndex ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Post Details Section */}
          <div className="px-4 pb-4">
            {/* Author Info */}
            <div className="flex items-center gap-2 mb-3">
              <Image
                src={currentPost.author.avatar || "/icon-white.svg"}
                alt={currentPost.author.displayName}
                width={40}
                height={40}
                className="rounded-full h-10 w-10 object-cover cursor-pointer"
                onClick={() => router.push(`/profile/${currentPost.author.username}`)}
              />
              <div className="flex-1">
                <div
                  className="font-medium text-foreground hover:underline cursor-pointer"
                  onClick={() => router.push(`/profile/${currentPost.author.username}`)}
                >
                  {currentPost.author.displayName}
                </div>
                <div className="text-xs text-muted-foreground">{timeAgo}</div>
              </div>
            </div>

            {/* Title */}
            <h2 className="font-bold text-lg mb-2">
              {currentPost.title}
            </h2>

            {/* Content */}
            {currentPost.content && (
              <div className="text-sm text-foreground/90 mb-3 whitespace-pre-wrap">
                <LinkifiedContent>{currentPost.content}</LinkifiedContent>
              </div>
            )}

            {/* Tags */}
            {currentPost.tags && currentPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentPost.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-accent/50 text-xs rounded-full hover:bg-accent cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tag/${encodeURIComponent(tag.name)}`);
                    }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Interaction Section */}
          <div className="px-4 pb-6">
            <Separator className="mb-4" />

            {/* Vote & Comment Count */}
            <div className="flex items-center gap-3 mb-4">
              <VoteButtons
                votes={currentPost.votes}
                userVote={currentPost.userVote}
                onVote={handleVoteClick}
                size="md"
                orientation="horizontal"
              />

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare size={18} />
                <span className="text-sm font-medium">{currentPost.commentCount} ความคิดเห็น</span>
              </div>
            </div>

            {/* Comment Form */}
            <div className="mb-6">
              <CommentForm
                postId={post.id}
                onSubmit={handleCommentSubmit}
                placeholder="แสดงความคิดเห็น..."
              />
            </div>

            {/* Comment Tree */}
            {comments.length > 0 && (
              <div>
                <CommentTree
                  comments={comments}
                  onVote={handleCommentVote}
                  onReply={handleReply}
                  onReplySubmit={handleCommentSubmit}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              </div>
            )}

            {/* Hint at bottom */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              ปัดลงเพื่อปิด
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
