"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Star, Repeat2 } from "@/config/icons";
import { VoteButtons } from "./VoteButtons";
import { ShareDropdown } from "./ShareDropdown";
import { PostActions } from "./PostActions";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/models";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useToggleVote } from "../hooks/useVotes";
import { useToggleSave } from "../hooks/useSaved";
import { useDeletePost } from "../hooks/usePosts";
import { useUser } from '@/features/auth';
import { LinkifiedContent } from "@/components/common";
import { MediaDisplay } from "@/components/media";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { MEDIA_DISPLAY, SAVE_COLOR } from "@/config/constants";

interface PostDetailProps {
  post: Post;
  onCommentClick?: () => void;
}

/**
 * PostDetail - Full Post Display for Detail Page
 *
 * Features:
 * - Full content display (no line-clamp)
 * - Media gallery with lightbox support
 * - Full interaction (vote, comment, save, share)
 * - No navigation (already on detail page)
 *
 * Usage:
 * - Use in /post/[id] page
 * - NOT for feed/list (use PostCard instead)
 */
export function PostDetail({
  post,
  onCommentClick
}: PostDetailProps) {
  const router = useRouter();
  const currentUser = useUser();
  const { requireAuth } = useAuthGuard();

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
    if (!requireAuth('บันทึกโพสต์')) return;
    handleToggleSave(post.id, post.isSaved);
  };

  const handleCommentButtonClick = () => {
    if (onCommentClick) {
      onCommentClick();
    }
    // No navigation - already on detail page
  };

  return (
    <div className="bg-card border overflow-hidden">
      <div className="w-full p-4 pb-0">
        {/* Header: Author + Time + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src={post.author.avatar || "/icon-white.svg"}
              alt={post.author.displayName}
              width={40}
              height={40}
              className="rounded-full h-10 w-10 object-cover cursor-pointer"
              onClick={() => router.push(`/profile/${post.author.username}`)}
            />
            <div>
              <div
                className="font-medium text-foreground hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${post.author.username}`)}
              >
                {post.author.displayName}
              </div>
              <div className="text-xs">{timeAgo}</div>
            </div>
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
        <h1 className="font-bold text-2xl mb-3">
          {post.title}
        </h1>

        {/* Content - Full Display (No Line Clamp) */}
        {post.content && (
          <div className="text-base text-foreground/90 mb-4 whitespace-pre-wrap">
            <LinkifiedContent>{post.content}</LinkifiedContent>
          </div>
        )}

        {/* Crosspost - Source Post */}
        {post.sourcePost && (
          <div className="border-l-2 border-primary/60 pl-3 mb-4">
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
              <Repeat2 size={16} />
              <span>โพสต์จาก @{post.sourcePost.author.username}</span>
            </div>

            {/* Source Post Preview */}
            <div
              className="relative overflow-hidden rounded-md bg-muted/40"
              style={{ maxHeight: `${MEDIA_DISPLAY.MAX_HEIGHT.CROSSPOST}px` }}
            >
              <div
                onClick={() => router.push(`/post/${post.sourcePost!.id}`)}
                className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <h3 className="font-semibold text-base mb-1 hover:text-primary transition-colors">
                  {post.sourcePost.title}
                </h3>
                <div className="text-sm text-muted-foreground line-clamp-3 mb-2">
                  <LinkifiedContent>{post.sourcePost.content}</LinkifiedContent>
                </div>

                {/* Source Post Media - Preview Only */}
                {post.sourcePost.media && post.sourcePost.media.length > 0 && (
                  <div className="rounded-md overflow-hidden bg-muted">
                    {post.sourcePost.media[0].type === "video" ? (
                      <video
                        src={post.sourcePost.media[0].url}
                        poster={post.sourcePost.media[0].thumbnail || undefined}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: `${MEDIA_DISPLAY.MAX_HEIGHT.CROSSPOST_MEDIA}px` }}
                      />
                    ) : (
                      <Image
                        src={post.sourcePost.media[0].url}
                        alt="Source post media"
                        width={600}
                        height={MEDIA_DISPLAY.MAX_HEIGHT.CROSSPOST_MEDIA}
                        className="w-full h-auto object-contain"
                        style={{ maxHeight: `${MEDIA_DISPLAY.MAX_HEIGHT.CROSSPOST_MEDIA}px` }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Gradient Overlay + "View Original Post" Button */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pointer-events-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/post/${post.sourcePost!.id}`);
                  }}
                  className="mb-2 text-xs px-3 py-1.5 rounded-full bg-background border border-border shadow-sm hover:bg-accent hover:border-accent-foreground transition-colors pointer-events-auto font-medium"
                >
                  ดูโพสต์ต้นฉบับ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Section - Edge-to-Edge with Lightbox Support */}
      {post.media && post.media.length > 0 && (
        <div className="w-full">
          <MediaDisplay
            media={post.media.map((m) => {
              // Fallback: Check URL extension
              const urlLower = m.url.toLowerCase();
              const isVideoByUrl = /\.(mp4|webm|mov|avi)$/i.test(urlLower);
              const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlLower);

              let type: 'image' | 'video' = 'image';
              if (isVideoByUrl) {
                type = 'video';
              } else if (isImageByUrl) {
                type = 'image';
              } else {
                type = m.type === 'video' ? 'video' : 'image';
              }

              return {
                id: m.id,
                url: m.url,
                type,
                thumbnail: m.thumbnail || undefined,
              };
            })}
            variant="detail"
            className="rounded-none"
            disableLightbox={false} // ✅ Enable lightbox!
          />
        </div>
      )}

      {/* Tags & Actions Section */}
      <div className="p-4 pt-3">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-sm">
          {/* Vote Buttons */}
          <VoteButtons
            votes={post.votes}
            userVote={post.userVote}
            onVote={handleVoteClick}
            size="sm"
            orientation="horizontal"
          />

          {/* Comments */}
          <button
            onClick={handleCommentButtonClick}
            className="inline-flex items-center gap-1.5 bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <MessageSquare size={16} />
            <span className="font-medium">{post.commentCount}</span>
          </button>

          {/* Share */}
          <ShareDropdown postId={post.id} postTitle={post.title} />

          {/* Save */}
          {currentUser && (
            <button
              onClick={handleSaveClick}
              className={cn(
                "inline-flex items-center justify-center bg-muted/30 hover:bg-muted/50 p-2 rounded-full transition-colors",
                post.isSaved
                  ? SAVE_COLOR.text
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={post.isSaved ? "บันทึกแล้ว" : "บันทึก"}
            >
              <Star size={16} className={cn(post.isSaved && SAVE_COLOR.fill)} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
