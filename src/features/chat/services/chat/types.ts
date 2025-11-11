/**
 * WebSocket Type Definitions
 */

import type { ChatMessage } from '@/shared/types/models';

// Base WebSocket message structure
export interface WebSocketMessage {
  type: string;
  payload?: any;
}

// Server → Client Events
export type ServerEvent =
  | 'connection.success'
  | 'initial.online.status'
  | 'message.sent'
  | 'message.new'
  | 'message.read_ack'
  | 'message.read_update'
  | 'message.video.updated'      // Video encoding progress/completed
  | 'message.video.completed'     // Video encoding completed (alternative)
  | 'user.online'
  | 'user.offline'
  | 'typing.notification'
  | 'error';

// Client → Server Events
export type ClientEvent =
  | 'message.send'
  | 'message.read'
  | 'typing.start'
  | 'typing.stop'
  | 'ping';

// Payload types for specific events
export interface NewMessagePayload {
  message: ChatMessage;
}

export interface MessageSentPayload {
  message: ChatMessage;
  tempId?: string;
}

export interface MessageReadUpdatePayload {
  conversationId: string;
  readBy: string;
  readAt: string;
}

export interface UserOnlinePayload {
  userId: string;
  lastSeen: string;
}

export interface UserOfflinePayload {
  userId: string;
  lastSeen: string;
}

export interface InitialOnlineStatusPayload {
  users: Array<{
    userId: string;
    isOnline: boolean;
    lastSeen: string;
  }>;
}

export interface TypingNotificationPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ErrorPayload {
  message?: string;
}

export interface MessageVideoUpdatedPayload {
  conversationId: string;
  messageId: string;
  media: {
    id: string;
    type: 'video';
    url: string;
    thumbnail?: string;
    encodingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    encodingProgress: number;
    hlsUrl?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
}
