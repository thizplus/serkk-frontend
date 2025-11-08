"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHydration } from "@/lib/hooks/useHydration";
import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import { ChatMessageImage } from "./ChatMessageImage";
import { ChatMessageVideo } from "./ChatMessageVideo";
import { ChatMessageFile } from "./ChatMessageFile";
import type { ChatMessage as ChatMessageType, ChatUser } from "@/lib/data/mockChats";
import type { ChatMessage as RealChatMessage, ChatUser as RealChatUser } from "@/lib/types/models";

interface ChatMessageProps {
  message: ChatMessageType | RealChatMessage;
  sender: ChatUser | RealChatUser;
  isOwnMessage: boolean;
}

export function ChatMessage({ message, sender, isOwnMessage }: ChatMessageProps) {
  const isMounted = useHydration();

  // Handle both Date and string types for createdAt
  const messageDate = typeof message.createdAt === 'string'
    ? new Date(message.createdAt)
    : message.createdAt;

  // ✅ Always show time (prevent layout shift)
  const time = messageDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Check if this is a temporary/sending message
  const isSending = message.id.startsWith('temp-');

  // Get avatar from union type
  const senderAvatar = 'avatarUrl' in sender ? sender.avatarUrl : sender.avatar;

  return (
    <div
      className={cn(
        "flex gap-2 mb-4",
        isOwnMessage && "flex-row-reverse"
      )}
    >
      {/* Avatar (only for other user) */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || undefined} alt={sender.displayName} />
          <AvatarFallback className="text-xs">{sender.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start",
          "max-w-[70%]"
        )}
      >
        {/* Sender Name (only for other user) */}
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground px-2">
            {sender.displayName}
          </span>
        )}

        {/* Message Content by Type */}
        <div className="flex flex-col gap-2">
          {/* Media Content (Image, Video, File) */}
          {message.type === "image" && message.media && (
            <ChatMessageImage media={message.media} isOwnMessage={isOwnMessage} />
          )}

          {message.type === "video" && message.media && (
            <ChatMessageVideo media={message.media} isOwnMessage={isOwnMessage} />
          )}

          {message.type === "file" && message.media && (
            <ChatMessageFile media={message.media} isOwnMessage={isOwnMessage} />
          )}

          {/* Text Caption (if exists) */}
          {message.content && (
            <div
              className={cn(
                "rounded-2xl px-4 py-2 break-words",
                isOwnMessage
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
        </div>

        {/* Time & Read Status - ✅ Always show to prevent layout shift */}
        <div className={cn(
          "flex items-center gap-1 px-2",
          isOwnMessage && "flex-row-reverse"
        )}>
          <span className="text-xs text-muted-foreground">{time}</span>
          {isOwnMessage && (
            <span className="flex items-center">
              {isSending ? (
                // Sending state - gray single check
                <Check className="h-4 w-4 text-gray-400" />
              ) : message.isRead ? (
                // Read - blue double check
                <CheckCheck className="h-4 w-4 text-blue-500" />
              ) : (
                // Sent but not read - gray double check
                <CheckCheck className="h-4 w-4 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
