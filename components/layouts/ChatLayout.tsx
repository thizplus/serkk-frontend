"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MessageCircle, ArrowLeft, MoreVertical, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { UpdatePromptAuto } from "@/components/pwa/UpdatePromptAuto";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import { ChatProfileSheet } from "@/components/chat/ChatProfileSheet";
import { OnlineStatus } from "@/components/chat/OnlineStatus";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/lib/hooks/queries/useUsers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { useUnreadNotificationCount } from "@/lib/hooks/queries/useNotifications";
import { useHydration } from "@/lib/hooks/useHydration";
import { formatLastSeen } from "@/lib/data/mockChats";
import type { ChatUser } from "@/lib/data/mockChats";

interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showHeader?: boolean;
  chatUser?: ChatUser;
  onBlockUser?: () => void;
}

export default function ChatLayout({
  children,
  sidebar,
  showHeader = true,
  chatUser,
  onBlockUser,
}: ChatLayoutProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const isMounted = useHydration();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Connect WebSocket for real-time chat
  useWebSocket();

  // Fetch unread notification count
  const { data: unreadCount = 0, isLoading } = useUnreadNotificationCount();

  // Determine if we're on /chat page (not in conversation)
  const isOnChatList = pathname === "/chat";

  // Status text for chat user
  const statusText = chatUser && isMounted
    ? (chatUser.isOnline ? "ออนไลน์" : `ออฟไลน์ ${formatLastSeen(chatUser.lastSeen)}`)
    : chatUser?.isOnline ? "ออนไลน์" : "ออฟไลน์";

  const handleViewProfile = () => {
    setSheetOpen(true);
  };

  // Fetch profile และ sync ไปยัง Zustand store
  const { data: profileData } = useProfile();

  // Sync profile data ไปยัง Zustand เมื่อได้ข้อมูลใหม่
  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
  }, [profileData, setUser]);

  return (
    <>
      <SidebarProvider
        style={{
          "--sidebar-width": "22rem",
        } as React.CSSProperties}
      >
        {/* Sidebar - Chat List */}
        {sidebar}

        <SidebarInset>
          {/* Header */}
          {showHeader && (
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />

                {/* Back Button - Desktop only (only show when in conversation) */}
                {!isOnChatList && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex flex-shrink-0"
                    asChild
                  >
                    <Link href="/chat">
                      <ArrowLeft className="h-5 w-5" />
                    </Link>
                  </Button>
                )}

                {/* Chat User Info or Title */}
                {chatUser ? (
                  <>
                    {/* User Info in Header */}
                    <Link
                      href={`/profile/${chatUser.username}`}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={chatUser.avatarUrl || undefined} alt={chatUser.displayName} />
                          <AvatarFallback>{chatUser.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <OnlineStatus
                          isOnline={chatUser.isOnline}
                          size="sm"
                          className="absolute bottom-0 right-0"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-sm truncate">{chatUser.displayName}</h2>
                        <p className="text-xs text-muted-foreground truncate">{statusText}</p>
                      </div>
                    </Link>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleViewProfile}>
                          ดูโปรไฟล์
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={onBlockUser}
                        >
                          <Ban className="h-4 w-4 mr-2 text-destructive" />
                          บล็อกผู้ใช้
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Profile Sheet */}
                    {chatUser && (
                      <ChatProfileSheet
                        user={chatUser}
                        open={sheetOpen}
                        onOpenChange={setSheetOpen}
                        onBlock={onBlockUser}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-semibold">ข้อความ</h1>
                  </div>
                )}
              </div>

              {/* Actions: Theme Toggle & Notification (only when no chatUser) */}
              {!chatUser && (
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <Link href="/notifications">
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {isMounted && !isLoading && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      <span className="sr-only">การแจ้งเตือน</span>
                    </Button>
                  </Link>
                </div>
              )}
            </header>
          )}

          {/* Main Content */}
          {/* pb-16 (64px) สำหรับ MobileBottomNav บน mobile, md:pb-0 บน desktop */}
          <div className="flex flex-1 flex-col pb-16 md:pb-0 relative">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Auto-Update: Navigate Strategy */}
      <UpdatePromptAuto strategy="navigate" />
    </>
  );
}
