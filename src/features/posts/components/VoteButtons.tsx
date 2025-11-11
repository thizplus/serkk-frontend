"use client";

import { ArrowBigUp, ArrowBigDown } from "@/config/icons";
import { cn } from "@/lib/utils";
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
  // ไม่ต้องใช้ local state - ให้ React Query จัดการ optimistic update
  const handleVote = (voteType: 'up' | 'down') => {
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
            userVote === 'up' && "text-orange-500"
          )}
          aria-label="Upvote"
        >
          <ArrowBigUp
            size={iconSizes[size]}
            className={cn(
              userVote === 'up' && "fill-orange-500"
            )}
          />
        </button>

        {/* Vote Count */}
        <span className={cn(
          "font-semibold px-1",
          textSizes[size],
          userVote === 'up' && "text-orange-500",
          userVote === 'down' && "text-blue-500"
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
            userVote === 'down' && "text-blue-500"
          )}
          aria-label="Downvote"
        >
          <ArrowBigDown
            size={iconSizes[size]}
            className={cn(
              userVote === 'down' && "fill-blue-500"
            )}
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
          userVote === 'up' && "text-orange-500"
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp
          size={iconSizes[size]}
          className={cn(
            userVote === 'up' && "fill-orange-500"
          )}
        />
      </button>

      {/* Vote Count */}
      <span className={cn(
        "font-semibold",
        textSizes[size],
        userVote === 'up' && "text-orange-500",
        userVote === 'down' && "text-blue-500"
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
          userVote === 'down' && "text-blue-500"
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown
          size={iconSizes[size]}
          className={cn(
            userVote === 'down' && "fill-blue-500"
          )}
        />
      </button>
    </div>
  );
}
