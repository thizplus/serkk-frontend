"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatListItem } from "./ChatListItem";
import { OnlineStatus } from "./OnlineStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/stores/authStore";
import { mockCurrentUser } from "@/lib/data/mockChats";
import type { ChatUser } from "@/lib/data/mockChats";
import type { User, Conversation, ChatUser as RealChatUser } from "@/lib/types/models";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeUsername?: string;
  isLoading?: boolean;
}

// Helper functions for safe property access on union type
const getUserAvatar = (user: ChatUser | User | RealChatUser): string | null => {
  if ('avatarUrl' in user) {
    return user.avatarUrl;
  }
  if ('avatar' in user) {
    return user.avatar;
  }
  return null;
};

const getUserDisplayName = (user: ChatUser | User | RealChatUser): string => {
  // Both types have displayName and username, so we can safely access them
  return user.displayName || user.username;
};

export function ChatSidebar({ conversations, activeUsername, isLoading = false }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();

  // Use real user data from auth store, fallback to mock
  const currentUser = user || mockCurrentUser;

  // ✅ ใช้ user.id จาก authStore (ถ้า login) หรือ mockCurrentUser.id (ถ้าไม่ได้ login)
  const currentUserId = user?.id || mockCurrentUser.id;

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar variant="inset">
      {/* Header */}
      <SidebarHeader className="px-4 py-3">
        {/* Current User Profile */}
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={`/profile/${currentUser.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors flex-1 min-w-0"
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={getUserAvatar(currentUser) || undefined}
                  alt={getUserDisplayName(currentUser)}
                />
                <AvatarFallback>
                  {getUserDisplayName(currentUser)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <OnlineStatus
                isOnline={true}
                size="sm"
                className="absolute bottom-0 right-0"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {getUserDisplayName(currentUser)}
              </h3>
              <p className="text-xs text-muted-foreground">ออนไลน์</p>
            </div>
          </Link>

          {/* Exit/Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            asChild
          >
            <Link href="/">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">กลับไปหน้าหลัก</span>
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาแชท..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            การสนทนา ({filteredConversations.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
                </div>
              ) : filteredConversations.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div>
                    {filteredConversations.map((conversation) => (
                      <ChatListItem
                        key={conversation.id}
                        conversation={conversation}
                        currentUserId={currentUserId}
                        isActive={conversation.otherUser.username === activeUsername}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "ไม่พบผลการค้นหา" : "ยังไม่มีการสนทนา"}
                  </p>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
