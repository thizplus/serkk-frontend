"use client";

import { useState } from "react";
import { Search } from "@/shared/config/icons";
import { Input } from "@/components/ui/input";
import { ChatListItem } from "./ChatListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Conversation } from "@/shared/types/models";

interface ChatListProps {
  conversations: Conversation[];
  currentUserId?: string;
  activeUsername?: string;
}

export function ChatList({ conversations, currentUserId, activeUsername }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-3">ข้อความ</h2>

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
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "ไม่พบผลการค้นหา" : "ยังไม่มีการสนทนา"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
