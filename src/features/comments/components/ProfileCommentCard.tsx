"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ArrowUpCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { CommentWithPost } from "@/shared/types/models";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LinkifiedContent } from "@/shared/components/common";

interface ProfileCommentCardProps {
  comment: CommentWithPost;
}

/**
 * ProfileCommentCard - แสดง comment ในหน้า profile พร้อมลิงก์ไปโพสต์
 * ใช้สำหรับแสดงรายการ comments ของผู้ใช้
 */
export function ProfileCommentCard({ comment }: ProfileCommentCardProps) {
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: th,
  });

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="py-0">
        {/* Post Title with Link */}
        <div className="flex items-start gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <Link
              href={`/post/${comment.postId}`}
              className="text-sm font-medium hover:underline line-clamp-2 text-foreground"
            >
              แสดงความคิดเห็นใน: {comment.post.title}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              โดย {comment.post.author.displayName}  |  {timeAgo}
            </p>
            
          </div>
        </div>

        {/* Comment Content */}
        <div className="pl-6">
          <div className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-3 mb-3">
            <LinkifiedContent>{comment.content}</LinkifiedContent>
          </div>

          {/* Footer: Votes, Time, Link */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {/* Votes */}
            <div className="flex items-center gap-1">
              <ArrowUpCircle
                className={cn(
                  "h-3.5 w-3.5",
                  comment.votes > 0 && "text-orange-500",
                  comment.votes < 0 && "text-blue-500"
                )}
              />
              <span
                className={cn(
                  "font-medium",
                  comment.votes > 0 && "text-orange-500",
                  comment.votes < 0 && "text-blue-500"
                )}
              >
                {comment.votes > 0 ? `+${comment.votes}` : comment.votes}
              </span>
            </div>

            {/* Reply Count */}
            {comment.replyCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{comment.replyCount} ตอบกลับ</span>
              </div>
            )}

           

            {/* Link to Post */}
            <Link
              href={`/post/${comment.postId}#comment-${comment.id}`}
              className="ml-auto flex items-center gap-1 text-primary hover:underline"
            >
              <span>ดูโพสต์</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
