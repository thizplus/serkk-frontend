"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OnlineStatus } from "./OnlineStatus";
import { ChatProfileSheet } from "./ChatProfileSheet";
import { formatLastSeen } from "@/shared/lib/data/mockChats";
import { useHydration } from "@/shared/hooks/useHydration";
import type { ChatUser } from "@/shared/lib/data/mockChats";
import type { ChatUser as RealChatUser } from "@/shared/types/models";

interface ChatHeaderProps {
  user: ChatUser | RealChatUser;
  onBlock?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({ user, onBlock, showBackButton = false }: ChatHeaderProps) {
  const isMounted = useHydration();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Helper to get avatar
  const userAvatar = 'avatarUrl' in user ? user.avatarUrl : user.avatar;

  const statusText = isMounted
    ? (user.isOnline ? "ออนไลน์" : `ออฟไลน์ ${formatLastSeen(user.lastSeen)}`)
    : (user.isOnline ? "ออนไลน์" : "ออฟไลน์");

  const handleViewProfile = () => {
    setSheetOpen(true);
  };

  return (
    <div className="flex items-center gap-3 p-4 border-b bg-background">
      {/* Back Button (Desktop) - Always show on desktop */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex shrink-0"
        asChild
      >
        <Link href="/chat">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>

      {/* Back Button (Mobile) - Only when showBackButton is true */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          asChild
        >
          <Link href="/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      )}

      {/* User Info */}
      <Link
        href={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar || undefined} alt={user.displayName} />
            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <OnlineStatus
            isOnline={user.isOnline}
            size="sm"
            className="absolute bottom-0 right-0"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{user.displayName}</h2>
          <p className="text-xs text-muted-foreground truncate">{statusText}</p>
        </div>
      </Link>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewProfile}>
            ดูโปรไฟล์
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onBlock}
          >
            <Ban className="h-4 w-4 mr-2 text-destructive" />
            บล็อกผู้ใช้
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Sheet */}
      <ChatProfileSheet
        user={user}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onBlock={onBlock}
      />
    </div>
  );
}
