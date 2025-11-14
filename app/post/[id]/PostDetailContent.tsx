"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "@/config/icons";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { PostCard } from "@/features/posts";
import { CommentTree } from "@/features/comments";
import { CommentForm } from "@/features/comments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePost } from "@/features/posts";
import {
  useCommentTree,
  useCreateComment,
  useUpdateComment,
  useDeleteComment
} from "@/features/comments";
import { useToggleVote } from "@/features/posts";
import type { CommentWithReplies } from "@/types/models";

interface PostDetailContentProps {
  postId: string;
}

export function PostDetailContent({ postId }: PostDetailContentProps) {
  const router = useRouter();

  // Fetch post from API
  const { data: post, isLoading: isLoadingPost, error: postError } = usePost(postId);

  // Fetch comments tree from API
  const { data: comments = [], isLoading: isLoadingComments } = useCommentTree(postId, {
    maxDepth: 10,
  });

  // Comment mutations
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  // Vote for comments
  const { handleVote: handleCommentVoteToggle } = useToggleVote();

  // Loading state
  if (isLoadingPost) {
    return (
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <PageWrap>
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">กำลังโหลดโพสต์...</p>
            </CardContent>
          </Card>
        </PageWrap>
      </AppLayout>
    );
  }

  // Error state
  if (postError || !post) {
    return (
      <AppLayout breadcrumbs={[{ label: "เกิดข้อผิดพลาด" }]}>
        <PageWrap>
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-bold mb-2">ไม่พบโพสต์</h2>
              <p className="text-muted-foreground mb-6">
                {postError instanceof Error
                  ? postError.message
                  : 'ไม่สามารถโหลดโพสต์ได้'}
              </p>
              <Button size={'sm'} onClick={() => router.push("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </PageWrap>
      </AppLayout>
    );
  }

  // Helper: Count all comments recursively (including all replies at all depths)
  const countAllComments = (comments: CommentWithReplies[]): number => {
    let count = 0;
    for (const comment of comments) {
      count += 1; // Count this comment
      if (comment.replies && comment.replies.length > 0) {
        count += countAllComments(comment.replies); // Count all nested replies
      }
    }
    return count;
  };

  const totalCommentCount = countAllComments(comments);

  // Handlers
  const handleCommentVote = (commentId: string, vote: 'up' | 'down') => {
    // หา comment จาก commentId เพื่อดึง userVote (ต้องค้นหาแบบ recursive ในโครงสร้าง tree)
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

    handleCommentVoteToggle(commentId, 'comment', vote, currentUserVote);
  };

  const handleReply = (commentId: string) => {
    // Reply functionality is handled by CommentCard internally
    console.log('Reply to comment:', commentId);
  };

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    await createComment.mutateAsync({
      postId,
      content,
      parentId: parentId || null,
    });
  };

  const handleEditComment = (commentId: string, newContent: string) => {
    updateComment.mutate({
      id: commentId,
      data: { content: newContent }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    // Dialog confirmation is handled by CommentCard
    deleteComment.mutate(commentId);
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: post.title },
      ]}
    >
      {/* Back Button - wrapped with PageWrap */}
      <PageWrap>
        <Button
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับ
        </Button>
      </PageWrap>

      {/* Post Card - NO WRAP (edge-to-edge) */}
      <PostCard post={post} disableNavigation />

      {/* Comments Section - wrapped with PageWrap */}
      <PageWrap>
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            ความคิดเห็น ({isLoadingComments ? '...' : totalCommentCount})
          </h2>

          {/* Comment Form */}
          <div className="mb-6">
            <CommentForm
              postId={postId}
              onSubmit={handleCommentSubmit}
              placeholder="แสดงความคิดเห็นของคุณ..."
            />
          </div>

          {/* Loading Comments */}
          {isLoadingComments && (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">กำลังโหลดความคิดเห็น...</p>
            </div>
          )}

          {/* Comments Tree */}
          {!isLoadingComments && (
            <CommentTree
              comments={comments}
              onVote={handleCommentVote}
              onReply={handleReply}
              onReplySubmit={handleCommentSubmit}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
          )}
        </div>
      </PageWrap>
    </AppLayout>
  );
}
