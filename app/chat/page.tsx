"use client";

import { useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindowEmpty } from "@/components/chat/ChatWindow";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { UserSearchDialog } from "@/components/chat/UserSearchDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/stores/chatStore";
import ChatLayout from "@/components/layouts/ChatLayout";

export default function ChatPage() {
  const { conversations, conversationsLoading, fetchConversations } = useChatStore();

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <ChatLayout sidebar={<ChatSidebar conversations={conversations} isLoading={conversationsLoading} />}>
      {/* Desktop: Empty State */}
      <div className="hidden md:flex md:flex-col md:flex-1 md:h-full">
        <ChatWindowEmpty />
      </div>

      {/* Mobile: Show Chat List */}
      <div className="flex flex-col h-full md:hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold">การสนทนา</h2>
              <p className="text-sm text-muted-foreground">
                เลือกแชทเพื่อเริ่มการสนทนา
              </p>
            </div>
            <UserSearchDialog />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversationsLoading ? (
              <div className="text-center p-4 text-muted-foreground">กำลังโหลด...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">ยังไม่มีการสนทนา</div>
            ) : (
              conversations.map((conversation) => (
                <ChatListItem
                  key={conversation.id}
                  conversation={conversation}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </ChatLayout>
  );
}
