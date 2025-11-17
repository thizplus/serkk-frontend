"use client";

import { Heart, Skull } from "@/config/icons";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { VOTE_COLORS } from "@/shared/config/constants";
import type { UserVote } from "@/types/common";

interface VoteButtonsProps {
  votes: number;
  userVote?: UserVote;
  onVote: (vote: 'up' | 'down') => void;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
}

export function VoteButtons({
  votes,
  userVote,
  onVote,
  size = 'md',
  orientation = 'vertical'
}: VoteButtonsProps) {
  const { requireAuth } = useAuthGuard();

  // ไม่ต้องใช้ local state - ให้ React Query จัดการ optimistic update
  const handleVote = (voteType: 'up' | 'down') => {
    // ✅ Require auth before voting
    if (!requireAuth('โหวต')) return;
    onVote(voteType);
  };

  const sizeClasses = {
    sm: "w-8",
    md: "w-10",
    lg: "w-12"
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  // Horizontal Badge Style
  if (orientation === 'horizontal') {
    return (
      <div className="inline-flex items-center gap-1 bg-muted/30 rounded-full px-2 py-1">
        {/* Upvote Button */}
        <button
          onClick={() => handleVote('up')}
          className={cn(
            "flex items-center justify-center p-0.5 rounded hover:bg-accent transition-colors",
            userVote === 'up' && VOTE_COLORS.upvote.text
          )}
          aria-label="Upvote"
        >
          <Heart
            size={iconSizes[size]}
            className={cn(
              userVote === 'up' && VOTE_COLORS.upvote.fill
            )}
          />
        </button>

        {/* Vote Count */}
        <span className={cn(
          "font-semibold px-1",
          textSizes[size],
          userVote === 'up' && VOTE_COLORS.upvote.text,
          userVote === 'down' && VOTE_COLORS.downvote.text
        )}>
          {votes >= 1000
            ? `${(votes / 1000).toFixed(1)}k`
            : votes
          }
        </span>

        {/* Downvote Button */}
        <button
          onClick={() => handleVote('down')}
          className={cn(
            "flex items-center justify-center p-0.5 rounded hover:bg-accent transition-colors",
            userVote === 'down' && VOTE_COLORS.downvote.text
          )}
          aria-label="Downvote"
        >
          <Skull
            size={iconSizes[size]}
          />
        </button>
      </div>
    );
  }

  // Vertical Style (default)
  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5 bg-muted/30 rounded-md py-1",
      sizeClasses[size]
    )}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        className={cn(
          "flex items-center justify-center p-1 rounded hover:bg-accent transition-colors",
          userVote === 'up' && VOTE_COLORS.upvote.text
        )}
        aria-label="Upvote"
      >
        <Heart
          size={iconSizes[size]}
          className={cn(
            userVote === 'up' && VOTE_COLORS.upvote.fill
          )}
        />
      </button>

      {/* Vote Count */}
      <span className={cn(
        "font-semibold",
        textSizes[size],
        userVote === 'up' && VOTE_COLORS.upvote.text,
        userVote === 'down' && VOTE_COLORS.downvote.text
      )}>
        {votes >= 1000
          ? `${(votes / 1000).toFixed(1)}k`
          : votes
        }
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        className={cn(
          "flex items-center justify-center p-1 rounded hover:bg-accent transition-colors",
          userVote === 'down' && VOTE_COLORS.downvote.text
        )}
        aria-label="Downvote"
      >
        <Skull
          size={iconSizes[size]}
        />
      </button>
    </div>
  );
}
