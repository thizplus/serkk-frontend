"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { VoteButtons } from "@/features/posts/components/VoteButtons";
import { CommentForm } from "./CommentForm";
import { CommentActions } from "./CommentActions";
import { DeleteCommentDialog } from "./DeleteCommentDialog";
import { cn } from "@/lib/utils";
import type { Comment, CommentWithReplies } from "@/shared/types/models";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useUser } from '@/features/auth';
import { LinkifiedContent } from "@/shared/components/common";

interface CommentCardProps {
  comment: Comment | CommentWithReplies;
  depth?: number; // For tree structure
  isCollapsed?: boolean;
  onToggleCollapse?: (commentId: string) => void;
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  onReply?: (commentId: string) => void;
  onReplySubmit?: (content: string, parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentCard({
  comment,
  depth = 0,
  isCollapsed = false,
  onToggleCollapse,
  onVote = () => {},
  onReply,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}: CommentCardProps) {
  const router = useRouter();
  const currentUser = useUser();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: th
  });

  // Type guard to check if comment has replies
  const isCommentWithReplies = (comment: Comment | CommentWithReplies): comment is CommentWithReplies => {
    return 'replies' in comment && Array.isArray(comment.replies);
  };

  // Use replies array for tree structure (tree API ไม่ส่ง replyCount)
  const hasReplies = isCommentWithReplies(comment) && comment.replies.length > 0;
  const totalReplies = isCommentWithReplies(comment) ? comment.replies.length : 0;

  const handleReplyClick = () => {
    setIsReplying(true);
    onReply?.(comment.id);
  };

  const handleReplySubmit = async (content: string) => {
    if (onReplySubmit) {
      await onReplySubmit(content, comment.id);
      setIsReplying(false);
    }
  };

  const handleReplyCancel = () => {
    setIsReplying(false);
  };

  const isOwnComment = currentUser && comment.author.username === currentUser.username;

  const handleEditClick = (commentId: string) => {
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (onEditComment && editContent.trim()) {
      onEditComment(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDeleteClick = (commentId: string) => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteComment) {
      onDeleteComment(comment.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <div
      className={cn(
        "relative",
        depth === 0 && "mb-4",
        depth > 0 && "mt-2 pl-4 border-l-2 border-dashed border-muted"
      )}
      style={{
        marginLeft: depth > 0 ? `${depth * 2.5}rem` : '0'
      }}
    >
      <div>
        {/* Header: Author + Time */}
        <div className="flex items-center justify-between gap-2 text-sm mb-2">
          <div className="flex items-center gap-2">
            {/* Collapse/Expand Button */}
            {hasReplies && (
              <button
                onClick={() => onToggleCollapse?.(comment.id)}
                className="shrink-0 hover:bg-accent rounded p-0.5 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>
            )}

            <Image
              src={comment.author.avatar || "/icon-white.svg"}
              alt={comment.author.displayName}
              width={24}
              height={24}
              className="rounded-full max-h-6 object-cover cursor-pointer"
              onClick={() => router.push(`/profile/${comment.author.username}`)}
            />
            <span
              className="font-medium hover:underline cursor-pointer"
              onClick={() => router.push(`/profile/${comment.author.username}`)}
            >
              {comment.author.displayName}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{timeAgo}</span>

            {/* Show reply count when collapsed */}
            {isCollapsed && hasReplies && (
              <>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={() => onToggleCollapse?.(comment.id)}
                  className="text-xs text-primary hover:underline"
                >
                  {totalReplies} ความคิดเห็น
                </button>
              </>
            )}
          </div>

          {/* Comment Actions (Edit/Delete) - Only for own comments */}
          {isOwnComment && onEditComment && onDeleteComment && !isCollapsed && (
            <CommentActions
              commentId={comment.id}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </div>

        {/* Comment Text - Hidden when collapsed */}
        {!isCollapsed && (
          <>
            {isEditing ? (
              /* Edit Mode */
              <div className="mb-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleEditSave}
                    disabled={!editContent.trim()}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1.5 bg-muted text-foreground rounded-md text-xs hover:bg-muted/80"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">
                <LinkifiedContent>{comment.content}</LinkifiedContent>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-muted-foreground ml-2">(แก้ไขแล้ว)</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Vote Buttons - Badge Style */}
              <VoteButtons
                votes={comment.votes}
                userVote={comment.userVote}
                onVote={(vote) => onVote(comment.id, vote)}
                size="sm"
                orientation="horizontal"
              />

              {/* Reply Button */}
              {onReplySubmit && (
                <button
                  onClick={handleReplyClick}
                  className="inline-flex items-center gap-1.5 bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground text-xs"
                >
                  <MessageSquare size={14} />
                  <span>ตอบกลับ</span>
                </button>
              )}
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-3">
                <CommentForm
                  postId={comment.postId}
                  parentId={comment.id}
                  replyToUsername={comment.author.username}
                  onSubmit={handleReplySubmit}
                  onCancel={handleReplyCancel}
                  placeholder={`ตอบกลับ @${comment.author.username}...`}
                  autoFocus
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Note: Nested replies are handled by CommentList as flat array */}

      {/* Delete Confirmation Dialog */}
      <DeleteCommentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
