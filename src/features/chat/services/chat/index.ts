/**
 * Chat WebSocket Service - Public API
 * Provides singleton WebSocket client for real-time messaging
 */

import { ChatWebSocketClient } from './chatWebSocketClient';

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let chatWebSocketInstance: ChatWebSocketClient | null = null;

/**
 * Get ChatWebSocket singleton instance
 */
export function getChatWebSocket(): ChatWebSocketClient {
  if (!chatWebSocketInstance) {
    chatWebSocketInstance = new ChatWebSocketClient();
  }
  return chatWebSocketInstance;
}

/**
 * Disconnect and cleanup ChatWebSocket
 */
export function disconnectChatWebSocket(): void {
  if (chatWebSocketInstance) {
    chatWebSocketInstance.disconnect();
    chatWebSocketInstance = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Main client class (for advanced usage)
export { ChatWebSocketClient } from './chatWebSocketClient';

// Types
export type {
  WebSocketMessage,
  ServerEvent,
  ClientEvent,
  NewMessagePayload,
  MessageSentPayload,
  MessageReadUpdatePayload,
  UserOnlinePayload,
  UserOfflinePayload,
  InitialOnlineStatusPayload,
  TypingNotificationPayload,
  ErrorPayload,
} from './types';

// Default export (singleton getter)
export default getChatWebSocket;
