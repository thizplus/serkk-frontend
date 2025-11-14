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
import type { Post, CommentWithReplies } from "@/types/models";

interface CommentDrawerProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

/**
 * CommentDrawer - Comments-Only Drawer
 *
 * Features:
 * - Post title + vote buttons (sticky header)
 * - Comment form
 * - Nested comment tree
 * - Swipe down to dismiss
 * - 90vh height for better UX
 *
 * Use Case:
 * - Triggered by clicking comment icon on post
 * - Quick access to comments without media
 *
 * Migrated from POC6_CommentDrawer
 */
export function CommentDrawer({
  post,
  open,
  onClose,
}: CommentDrawerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { handleVote } = useToggleVote();
  const { data: comments = [], refetch: refetchComments } = useCommentTree(post.id, {
    maxDepth: 10,
  });
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  // Auto-scroll to top when opening
  useEffect(() => {
    if (open && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [open]);

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
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>ความคิดเห็น: {post.title}</DrawerTitle>
        </DrawerHeader>

        {/* Vertical Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Post Title & Info - Sticky Header */}
          <div className="px-4 pt-6 pb-4 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <h2 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h2>

            {/* Vote & Comment Count */}
            <div className="flex items-center gap-3">
              <VoteButtons
                votes={post.votes}
                userVote={post.userVote}
                onVote={handleVoteClick}
                size="sm"
                orientation="horizontal"
              />

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare size={16} />
                <span className="text-sm font-medium">{post.commentCount} ความคิดเห็น</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-4 pb-6">
            {/* Comment Form */}
            <div className="my-6">
              <CommentForm
                postId={post.id}
                onSubmit={handleCommentSubmit}
                placeholder="แสดงความคิดเห็น..."
              />
            </div>

            <Separator className="mb-6" />

            {/* Comment Tree */}
            {comments.length > 0 ? (
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
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">ยังไม่มีความคิดเห็น</p>
                <p className="text-xs mt-1">เป็นคนแรกที่แสดงความคิดเห็น</p>
              </div>
            )}

            {/* Hint at bottom */}
            <div className="mt-8 text-center text-xs text-muted-foreground">
              Swipe down to close
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
