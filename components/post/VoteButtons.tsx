"use client";

import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserVote } from "@/lib/types/common";

interface VoteButtonsProps {
  votes: number;
  userVote?: UserVote;
  onVote: (vote: 'up' | 'down') => void;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
}

export function VoteButtons({
  votes,
  userVote: initialUserVote,
  onVote,
  size = 'md',
  orientation = 'vertical'
}: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<UserVote>(initialUserVote || null);
  const [currentVotes, setCurrentVotes] = useState(votes);

  const handleVote = (voteType: 'up' | 'down') => {
    let newVoteCount = votes;
    let newUserVote: UserVote = voteType;

    // ถ้ากด vote เดิมอีกครั้ง = ยกเลิก vote
    if (userVote === voteType) {
      newUserVote = null;
      newVoteCount = votes - (voteType === 'up' ? 1 : -1);
    }
    // ถ้ามี vote อยู่แล้วแล้วกด vote ตรงข้าม
    else if (userVote) {
      newVoteCount = votes + (voteType === 'up' ? 2 : -2);
    }
    // ถ้ายังไม่ได้ vote
    else {
      newVoteCount = votes + (voteType === 'up' ? 1 : -1);
    }

    setUserVote(newUserVote);
    setCurrentVotes(newVoteCount);
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
          {currentVotes >= 1000
            ? `${(currentVotes / 1000).toFixed(1)}k`
            : currentVotes
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
        {currentVotes >= 1000
          ? `${(currentVotes / 1000).toFixed(1)}k`
          : currentVotes
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
