"use client";

import { useEffect, useRef } from "react";
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
import { useCommentTree, useCreateComment, useUpdateComment, useDeleteComment } from "@/features/comments";
import { Separator } from "@/components/ui/separator";
import { MessageSquare } from "lucide-react";
import type { MediaViewerProps } from "../types";
import type { CommentWithReplies } from "@/types/models";

/**
 * POC #5: Shadcn Drawer (Vertical Scroll + Vote + Comments)
 *
 * Technology:
 * - Drawer: Shadcn UI Drawer component (Vaul library)
 * - Layout: Vertical scroll (like Instagram/Facebook)
 * - Animation: Built-in drawer animations
 * - Vote: VoteButtons component
 * - Comments: CommentForm + CommentList
 *
 * Pros:
 * - ✅ Native mobile feel (bottom sheet)
 * - ✅ Smooth drawer animations
 * - ✅ Swipe down to dismiss
 * - ✅ Vertical scroll (เหมือน social media)
 * - ✅ Simple UX (no slide/buttons)
 * - ✅ Full interaction (vote + comment)
 */
export function POC5_Drawer({
  media,
  post,
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { handleVote } = useToggleVote();
  const { data: comments = [], refetch: refetchComments } = useCommentTree(post.id, {
    maxDepth: 10,
  });
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

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
    handleVote(post.id, 'post', vote, post.userVote);
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
    // Note: Vote mutations should already have invalidation built-in
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
      <DrawerContent className="h-[100vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>POC #5: Drawer (Vertical Scroll)</DrawerTitle>
        </DrawerHeader>

        {/* Vertical Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Media Section */}
          <div className="space-y-4 py-4">
            {media.map((item, index) => (
              <div
                key={item.id}
                data-index={index}
                className="w-full"
              >
                {item.type === 'video' ? (
                  <video
                    poster={item.thumbnail}
                    controls
                    playsInline
                    className="w-full max-h-[70vh] object-contain bg-black"
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

          {/* Interaction Section */}
          <div className="px-4 pb-6">
            <Separator className="mb-4" />

            {/* Vote & Comment Count */}
            <div className="flex items-center gap-3 mb-4">
              <VoteButtons
                votes={post.votes}
                userVote={post.userVote}
                onVote={handleVoteClick}
                size="md"
                orientation="horizontal"
              />

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare size={18} />
                <span className="text-sm font-medium">{post.commentCount} ความคิดเห็น</span>
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
              Swipe down to close
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
