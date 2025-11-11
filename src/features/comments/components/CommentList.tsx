"use client";

import { useState, useMemo } from "react";
import { CommentCard } from "./CommentCard";
import { EmptyComments } from "@/components/common";
import type { Comment } from "@/types/models";

interface CommentListProps {
  comments: Comment[];
  onVote?: (commentId: string, vote: 'up' | 'down') => void;
  onReply?: (commentId: string) => void;
  onReplySubmit?: (content: string, parentId: string) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentList({
  comments,
  onVote,
  onReply,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}: CommentListProps) {
  const [collapsedCommentIds, setCollapsedCommentIds] = useState<Set<string>>(new Set());

  // Toggle collapse
  const handleToggleCollapse = (commentId: string) => {
    setCollapsedCommentIds(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Filter comments: ซ่อนลูกหลานของ collapsed comments
  const visibleComments = useMemo(() => {
    // สร้าง map ของ parentId -> children
    const childrenMap = new Map<string, Set<string>>();
    comments.forEach((comment) => {
      if (comment.parentId) {
        if (!childrenMap.has(comment.parentId)) {
          childrenMap.set(comment.parentId, new Set());
        }
        childrenMap.get(comment.parentId)!.add(comment.id);
      }
    });

    // ฟังก์ชันหาลูกหลานทั้งหมด
    const getAllDescendants = (commentId: string): Set<string> => {
      const descendants = new Set<string>();
      const queue = [commentId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current);
        if (children) {
          children.forEach(childId => {
            descendants.add(childId);
            queue.push(childId);
          });
        }
      }

      return descendants;
    };

    // หา IDs ที่ต้องซ่อน
    const hiddenIds = new Set<string>();
    collapsedCommentIds.forEach(collapsedId => {
      const descendants = getAllDescendants(collapsedId);
      descendants.forEach(id => hiddenIds.add(id));
    });

    return comments.filter(comment => !hiddenIds.has(comment.id));
  }, [comments, collapsedCommentIds]);

  if (comments.length === 0) {
    return <EmptyComments />;
  }

  return (
    <div className="space-y-4">
      {visibleComments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          isCollapsed={collapsedCommentIds.has(comment.id)}
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
