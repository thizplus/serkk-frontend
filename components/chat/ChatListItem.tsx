"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { OnlineStatus } from "./OnlineStatus";
import { formatMessageTime } from "@/lib/data/mockChats";
import { useHydration } from "@/lib/hooks/useHydration";
import { cn } from "@/lib/utils";
import type { Conversation, ChatMessage, LastMessage } from "@/lib/types/models";

interface ChatListItemProps {
  conversation: Conversation;
  currentUserId?: string;
  isActive?: boolean;
}

/**
 * Get preview text for last message
 */
function getMessagePreview(
  message: ChatMessage | LastMessage | null | undefined,
  currentUserId?: string,
  hasUnread?: boolean
): string {
  if (!message) return "ยังไม่มีข้อความ";

  // ถ้ามี content (text/caption) ให้แสดง content
  if (message.content && message.content.trim() !== "") {
    return message.content;
  }

  // เช็คว่าเป็นผู้ส่งหรือผู้รับ
  // ถ้า lastMessage มี senderId ให้ใช้ senderId
  // ถ้าไม่มี senderId (LastMessage type) ให้ดูจาก unreadCount
  // unreadCount > 0 = ข้อความจากฝั่งตรงข้าม (ผู้รับ)
  // unreadCount = 0 = ข้อความที่เราส่ง (ผู้ส่ง)

  // ✅ แก้ไข: ใช้ sender.id แทน senderId เพราะ currentUserId อาจเป็น undefined
  // Backend ส่ง sender object มาครบ ใช้ sender.id เปรียบเทียบแทน
  const msgSender = (message as any).sender;
  const msgSenderId = msgSender?.id || (message as any).senderId;

  // ถ้า currentUserId เป็น undefined ให้ดูจาก unreadCount แทน
  const isSender = currentUserId && msgSenderId
    ? msgSenderId === currentUserId
    : !hasUnread;

  // ถ้าไม่มี content แสดงตาม type
  switch (message.type) {
    case "image":
      return isSender ? "คุณส่งรูปภาพ" : "ได้รับรูปภาพ";
    case "video":
      return isSender ? "คุณส่งวิดีโอ" : "ได้รับวิดีโอ";
    case "file":
      return isSender ? "คุณส่งไฟล์" : "ได้รับไฟล์";
    default:
      return "ยังไม่มีข้อความ";
  }
}

export function ChatListItem({ conversation, currentUserId, isActive = false }: ChatListItemProps) {
  const { otherUser, lastMessage, unreadCount } = conversation;
  const isMounted = useHydration();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="h-auto py-3"
        tooltip={otherUser.displayName}
      >
        <Link href={`/chat/${otherUser.username}`} className="flex items-center gap-3 w-full">
          {/* Avatar with Online Status */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.displayName} />
              <AvatarFallback className="text-xs">{otherUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <OnlineStatus
              isOnline={otherUser.isOnline}
              size="sm"
              className="absolute bottom-0 right-0"
            />
          </div>

          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className={cn(
                "font-semibold text-sm truncate",
                unreadCount > 0 && "text-primary"
              )}>
                {otherUser.displayName}
              </h3>
              {isMounted && lastMessage && (
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatMessageTime(lastMessage.createdAt)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs truncate",
                unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
              )}>
                {getMessagePreview(lastMessage, currentUserId, unreadCount > 0)}
              </p>
              {unreadCount > 0 && (
                <span className="flex-shrink-0 ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
