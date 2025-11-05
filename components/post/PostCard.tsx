"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Bookmark, Repeat2 } from "lucide-react";
import { VoteButtons } from "./VoteButtons";
import { ShareDropdown } from "./ShareDropdown";
import { PostActions } from "./PostActions";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types/models";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useToggleVote } from "@/lib/hooks/mutations/useVotes";
import { useToggleSave } from "@/lib/hooks/mutations/useSaved";
import { useDeletePost } from "@/lib/hooks/queries/usePosts";
import { useUser } from "@/lib/stores/authStore";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  disableNavigation?: boolean;
}

export function PostCard({
  post,
  compact = false,
  disableNavigation = false
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

  return (
    <div className={cn(
      "bg-card border rounded-lg overflow-hidden hover:border-accent transition-colors p-4"
    )}>
      <div className="w-full">
        {/* Header: Author + Time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image
              src={post.author.avatar || "/logo.png"}
              alt={post.author.displayName}
              width={30}
              height={30}
              className="rounded-full cursor-pointer max-h-[30px] object-cover"
              onClick={() => router.push(`/profile/${post.author.username}`)}
            />
            <span
              className="font-medium text-foreground hover:underline cursor-pointer"
              onClick={() => router.push(`/profile/${post.author.username}`)}
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
          onClick={handlePostClick}
          className={cn(
            "font-semibold mb-2 hover:text-primary transition-colors",
            compact ? "text-base line-clamp-2" : "text-lg",
            !disableNavigation && "cursor-pointer"
          )}
        >
          {post.title}
        </h1>

        {/* Content */}
        {!compact && post.content && (
          <p
            onClick={handlePostClick}
            className={cn(
              "text-sm text-foreground/90 mb-3 whitespace-pre-wrap line-clamp-3",
              !disableNavigation && "cursor-pointer hover:text-foreground"
            )}
          >
            {post.content}
          </p>
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
                onClick={() => router.push(`/post/${post.sourcePost!.id}`)}
                className="cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2"
              >
                <h3 className="font-semibold text-sm mb-1 hover:text-primary transition-colors">
                  {post.sourcePost.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {post.sourcePost.content}
                </p>

                {/* Source Post Media */}
                {post.sourcePost.media && post.sourcePost.media.length > 0 && (
                  <div className="rounded-md overflow-hidden bg-muted max-h-80">
                    {post.sourcePost.media[0].type === "video" ? (
                      <video
                        src={post.sourcePost.media[0].url}
                        className="w-full h-auto max-h-80 object-contain"
                        poster={post.sourcePost.media[0].thumbnail || undefined}
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
          <div
            onClick={handlePostClick}
            className={cn(
              "mb-3 rounded-md overflow-hidden",
              !disableNavigation && "cursor-pointer"
            )}
          >
            {post.media[0].type === "video" ? (
              <video
                src={post.media[0].url}
                controls
                className="w-full h-auto object-cover max-h-[500px]"
                poster={post.media[0].thumbnail || undefined}
              />
            ) : (
              <Image
                src={post.media[0].url}
                alt="Post media"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            )}
          </div>
        )}

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
      </div>
    </div>
  );
}
