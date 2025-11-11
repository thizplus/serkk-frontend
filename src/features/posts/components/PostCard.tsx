"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Bookmark, Repeat2, FileText, Loader2 } from "@/config/icons";
import { VoteButtons } from "./VoteButtons";
import { ShareDropdown } from "./ShareDropdown";
import { PostActions } from "./PostActions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useToggleVote } from "../hooks/useVotes";
import { useToggleSave } from "../hooks/useSaved";
import { useDeletePost } from "../hooks/usePosts";
import { useUser } from '@/features/auth';
import { LinkifiedContent } from "@/components/common";
import { MediaGrid } from "@/components/media/MediaGrid";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  disableNavigation?: boolean;
  isOptimistic?: boolean;
  optimisticData?: {
    tempId: string;
    uploadStatus: 'uploading' | 'completed' | 'failed';
    uploadProgress: number;
    error?: string;
  };
}

export function PostCard({
  post,
  compact = false,
  disableNavigation = false,
  isOptimistic = false,
  optimisticData
}: PostCardProps) {
  const router = useRouter();
  const currentUser = useUser();

  // Hooks for mutations
  const { handleVote } = useToggleVote();
  const { handleToggleSave } = useToggleSave();
  const deletePost = useDeletePost();
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: th
  });

  const isOwnPost = currentUser && post.author.username === currentUser.username;

  // Handlers
  const handlePostClick = () => {
    if (!disableNavigation) {
      router.push(`/post/${post.id}`);
    }
  };

  const handleCommentClick = () => {
    router.push(`/post/${post.id}`);
  };

  const handleEditClick = () => {
    router.push(`/edit-post/${post.id}`);
  };

  const handleDeleteClick = () => {
    deletePost.mutate(post.id);
  };

  const handleVoteClick = (vote: 'up' | 'down') => {
    handleVote(post.id, 'post', vote, post.userVote);
  };

  const handleSaveClick = () => {
    handleToggleSave(post.id, post.isSaved);
  };

  const isUploading = isOptimistic && optimisticData?.uploadStatus === 'uploading';
  const isFailed = isOptimistic && optimisticData?.uploadStatus === 'failed';

  return (
    <div className={cn(
      "bg-card border rounded-lg overflow-hidden hover:border-accent transition-colors p-4"
    )}>
      <div className="w-full">
        {/* ✅ Upload Status Badge & Progress */}
        {isUploading && optimisticData && (
          <div className="mb-3">
            <Badge variant="secondary" className="mb-2">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              กำลังอัปโหลด... {optimisticData.uploadProgress}%
            </Badge>
            <Progress value={optimisticData.uploadProgress} className="h-1" />
          </div>
        )}

        {/* ✅ Upload Failed Badge */}
        {isFailed && optimisticData && (
          <div className="mb-3">
            <Badge variant="destructive">
              อัปโหลดล้มเหลว
            </Badge>
            {optimisticData.error && (
              <p className="text-sm text-muted-foreground mt-1">
                {optimisticData.error}
              </p>
            )}
          </div>
        )}

        {/* Header: Author + Time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src={post.author.avatar || "/icon-white.svg"}
              alt={post.author.displayName}
              width={30}
              height={30}
              className={cn(
                "rounded-full max-h-[30px] object-cover",
                !isOptimistic && "cursor-pointer"
              )}
              onClick={!isOptimistic ? () => router.push(`/profile/${post.author.username}`) : undefined}
            />
            <span
              className={cn(
                "font-medium text-foreground",
                !isOptimistic && "hover:underline cursor-pointer"
              )}
              onClick={!isOptimistic ? () => router.push(`/profile/${post.author.username}`) : undefined}
            >
              {post.author.displayName}
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>

          {/* Post Actions (Edit/Delete) - Only for own posts */}
          {isOwnPost && (
            <PostActions
              postId={post.id}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </div>


        {/* Title */}
        <h1
          onClick={!isOptimistic ? handlePostClick : undefined}
          className={cn(
            "font-semibold mb-2",
            compact ? "text-base line-clamp-2" : "text-lg",
            !disableNavigation && !isOptimistic && "cursor-pointer hover:text-primary transition-colors"
          )}
        >
          {post.title}
        </h1>

        {/* Content */}
        {!compact && post.content && (
          <div
            onClick={!isOptimistic ? handlePostClick : undefined}
            className={cn(
              "text-sm text-foreground/90 mb-3 whitespace-pre-wrap line-clamp-3",
              !disableNavigation && !isOptimistic && "cursor-pointer hover:text-foreground"
            )}
          >
            <LinkifiedContent>{post.content}</LinkifiedContent>
          </div>
        )}

        {/* Crosspost - Source Post */}
        {post.sourcePost && (
          <div className="mb-3 border-l-4 border-primary/50">
            <div className="ml-3 p-3 bg-muted/30 rounded-r-lg">
              {/* Crosspost Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <Repeat2 size={14} />
                <span>โพสต์ข้ามจาก</span>
                <span className="font-medium text-foreground">
                  @{post.sourcePost.author.username}
                </span>
              </div>

              {/* Source Post Content */}
              <div
                onClick={!isOptimistic ? () => router.push(`/post/${post.sourcePost!.id}`) : undefined}
                className={cn(
                  "rounded-lg p-2 -m-2",
                  !isOptimistic && "cursor-pointer hover:bg-muted/50 transition-colors"
                )}
              >
                <h3 className={cn(
                  "font-semibold text-sm mb-1",
                  !isOptimistic && "hover:text-primary transition-colors"
                )}>
                  {post.sourcePost.title}
                </h3>
                <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  <LinkifiedContent>{post.sourcePost.content}</LinkifiedContent>
                </div>

                {/* Source Post Media */}
                {post.sourcePost.media && post.sourcePost.media.length > 0 && (
                  <div className="rounded-md overflow-hidden bg-muted max-h-80">
                    {post.sourcePost.media[0].type === "video" ? (
                      <video
                        src={post.sourcePost.media[0].url}
                        poster={post.sourcePost.media[0].thumbnail || undefined}
                        className="w-full h-auto max-h-80 object-contain"
                      />
                    ) : (
                      <Image
                        src={post.sourcePost.media[0].url}
                        alt="Source post media"
                        width={600}
                        height={400}
                        className="w-full h-auto max-h-80 object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="mb-3 relative">
            <MediaGrid
              media={post.media.map((m) => {
                // ✅ Fallback: เช็คจาก URL extension ถ้า backend type อาจผิด
                const urlLower = m.url.toLowerCase();
                const isVideoByUrl = /\.(mp4|webm|mov|avi)$/i.test(urlLower);
                const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlLower);

                // ใช้ URL extension เป็นหลัก (เพราะ backend อาจ return type ผิด)
                let type: 'image' | 'video' = 'image';
                if (isVideoByUrl) {
                  type = 'video';
                } else if (isImageByUrl) {
                  type = 'image';
                } else {
                  // Fallback: ใช้ backend type
                  type = m.type === 'video' ? 'video' : 'image';
                }

                return {
                  id: m.id,
                  url: m.url,
                  type,
                  thumbnail: m.thumbnail || undefined,
                };
              })}
              variant={disableNavigation ? 'detail' : 'feed'}
              className={cn(isUploading && "opacity-60")}
            />

            {/* ✅ Loading Overlay - แสดงตอนกำลังอัปโหลด */}
            {isUploading && optimisticData && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-3" />
                <p className="text-white text-base font-medium">
                  กำลังอัปโหลดวิดีโอ...
                </p>
                <p className="text-white/80 text-sm mt-1">
                  {optimisticData.uploadProgress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tags - ซ่อนถ้าเป็น optimistic post (tags ยังไม่ได้บันทึกจริง) */}
        {!isOptimistic && post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag) => (
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

        {/* Action Buttons - ซ่อนถ้ากำลัง upload */}
        {!isOptimistic && (
          <div className="flex items-center gap-2 text-sm">
            {/* Vote Buttons - Badge Style */}
            <VoteButtons
              votes={post.votes}
              userVote={post.userVote}
              onVote={handleVoteClick}
              size="sm"
              orientation="horizontal"
            />

            {/* Comments */}
            <button
              onClick={handleCommentClick}
              className="inline-flex items-center gap-1.5 bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <MessageSquare size={16} />
              <span className="font-medium">{post.commentCount}</span>
            </button>

            {/* Share */}
            <ShareDropdown postId={post.id} postTitle={post.title} />

            {/* Save */}
            <button
              onClick={handleSaveClick}
              className={cn(
                "inline-flex items-center gap-1.5 bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors",
                post.isSaved
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark size={16} className={cn(post.isSaved && "fill-current")} />
              <span className="font-medium">{post.isSaved ? "บันทึกแล้ว" : "บันทึก"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
