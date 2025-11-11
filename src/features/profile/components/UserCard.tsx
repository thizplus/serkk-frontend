"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, UserMinus } from "lucide-react";
import { useUser } from '@/features/auth';
import { useToggleFollow } from "../hooks/useFollowMutations";
import type { UserWithFollowStatus } from "@/types/models";

interface UserCardProps {
  user: UserWithFollowStatus;
  showFollowButton?: boolean;
}

/**
 * UserCard Component
 * แสดงข้อมูลผู้ใช้แบบ card พร้อมปุ่ม Follow/Unfollow
 */
export function UserCard({ user, showFollowButton = true }: UserCardProps) {
  const router = useRouter();
  const currentUser = useUser();
  const { handleToggleFollow, isLoading: isFollowLoading } = useToggleFollow();

  const isOwnProfile = currentUser?.id === user.id;

  const handleFollowClick = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const isFollowing = user.isFollowing === true;
    handleToggleFollow(user.id, isFollowing);
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors py-2">
      <CardContent className="py-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Avatar + Info */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => router.push(`/profile/${user.username}`)}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <Image
                src={user.avatar || "/icon-white.svg"}
                alt={user.displayName}
                width={48}
                height={48}
                className="rounded-full max-h-12 object-cover border-2 border-background"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate hover:underline">
                {user.displayName}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            
              {/* Stats */}
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">{user.followersCount || 0}</span> ผู้ติดตาม
                </span>

                <span>
                  <span className="font-semibold text-foreground">{user.karma || 0}</span> Karma
                </span>
              </div>
            </div>
          </div>

          {/* Right: Follow Button */}
          {showFollowButton && !isOwnProfile && (
            <Button
              onClick={handleFollowClick}
              size="sm"
              variant={user.isFollowing ? "outline" : "default"}
              disabled={isFollowLoading}
              className="shrink-0"
            >
              {user.isFollowing ? (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  เลิกติดตาม
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  ติดตาม
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
