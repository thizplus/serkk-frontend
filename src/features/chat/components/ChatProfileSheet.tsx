"use client";

import Link from "next/link";
import { Ban, User as UserIcon } from "@/shared/config/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { OnlineStatus } from "./OnlineStatus";
import { formatLastSeen } from "@/shared/lib/data/mockChats";
import { useHydration } from "@/shared/hooks/useHydration";
import type { ChatUser } from "@/shared/lib/data/mockChats";
import type { ChatUser as RealChatUser } from "@/shared/types/models";

interface ChatProfileSheetProps {
  user: ChatUser | RealChatUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlock?: () => void;
}

export function ChatProfileSheet({ user, open, onOpenChange, onBlock }: ChatProfileSheetProps) {
  const isMounted = useHydration();

  // Helper to get avatar
  const userAvatar = 'avatarUrl' in user ? user.avatarUrl : user.avatar;

  const statusText = isMounted
    ? (user.isOnline ? "ออนไลน์" : `ออฟไลน์ ${formatLastSeen(user.lastSeen)}`)
    : (user.isOnline ? "ออนไลน์" : "ออฟไลน์");

  const handleBlock = () => {
    onOpenChange(false);
    onBlock?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-6 sm:max-w-md">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle>ข้อมูลผู้ใช้</SheetTitle>
          <SheetDescription>
            รายละเอียดและการดำเนินการ
          </SheetDescription>
        </SheetHeader>

        {/* User Profile Info */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userAvatar || undefined} alt={user.displayName} />
              <AvatarFallback className="text-3xl">{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <OnlineStatus
              isOnline={user.isOnline}
              size="md"
              className="absolute bottom-1 right-1"
            />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="text-xs text-muted-foreground mt-2">{statusText}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            className="w-full justify-start"
            asChild
          >
            <Link href={`/profile/${user.username}`}>
              <UserIcon className="h-4 w-4 mr-2" />
              ดูโปรไฟล์เต็ม
            </Link>
          </Button>

       
        </div>
      </SheetContent>
    </Sheet>
  );
}
