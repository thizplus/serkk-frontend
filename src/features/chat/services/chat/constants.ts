/**
 * WebSocket Configuration Constants
 */

// Connection settings
export const MAX_RECONNECT_ATTEMPTS = 5;
export const INITIAL_RECONNECT_DELAY = 1000; // 1 second
export const PING_INTERVAL = 54000; // 54 seconds
export const CLOSE_CODE_NORMAL = 1000;

// WebSocket URL
export const getWebSocketUrl = (): string => {
  // ✅ New URL format: /ws/chat (Backend refactored WebSocket structure)
  return process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:8080/ws/chat';
};

// Auth token helper
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};
