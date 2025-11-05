"use client";

import { useState } from "react";
import { CommentCard } from "./CommentCard";
import type { CommentWithReplies } from "@/lib/types/models";

interface CommentTreeProps {
  comments: CommentWithReplies[];
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  onReply?: (commentId: string) => void;
  onReplySubmit?: (content: string, parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

/**
 * CommentTree Component
 * แสดง comments ในรูปแบบ tree structure (nested) แบบ recursive
 */
export function CommentTree({
  comments,
  onVote,
  onReply,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}: CommentTreeProps) {
  const [collapsedCommentIds, setCollapsedCommentIds] = useState<Set<string>>(new Set());

  const handleToggleCollapse = (commentId: string) => {
    setCollapsedCommentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นสิ!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentTreeItem
          key={comment.id}
          comment={comment}
          collapsedCommentIds={collapsedCommentIds}
          onToggleCollapse={handleToggleCollapse}
          onVote={onVote}
          onReply={onReply}
          onReplySubmit={onReplySubmit}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </div>
  );
}

/**
 * CommentTreeItem Component
 * แสดง comment เดี่ยวพร้อม replies แบบ recursive
 */
function CommentTreeItem({
  comment,
  depth = 0,
  collapsedCommentIds,
  onToggleCollapse,
  onVote,
  onReply,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}: {
  comment: CommentWithReplies;
  depth?: number;
  collapsedCommentIds: Set<string>;
  onToggleCollapse?: (commentId: string) => void;
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  onReply?: (commentId: string) => void;
  onReplySubmit?: (content: string, parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}) {
  const isCollapsed = collapsedCommentIds.has(comment.id);

  return (
    <>
      {/* Comment Card */}
      <CommentCard
        comment={comment}
        depth={depth}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onVote={onVote}
        onReply={onReply}
        onReplySubmit={onReplySubmit}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />

      {/* Nested Replies - Recursive (hidden when parent is collapsed) */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentTreeItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              collapsedCommentIds={collapsedCommentIds}
              onToggleCollapse={onToggleCollapse}
              onVote={onVote}
              onReply={onReply}
              onReplySubmit={onReplySubmit}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </>
  );
}
