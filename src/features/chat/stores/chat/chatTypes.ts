import type { Conversation, ChatMessage } from '@/shared/types/models';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Message state for each conversation
 */
export interface MessageState {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  isLoading: boolean;
}

/**
 * Conversation Actions
 */
export interface ConversationActions {
  /**
   * Fetch conversations
   */
  fetchConversations: () => Promise<void>;

  /**
   * Load more conversations
   */
  loadMoreConversations: () => Promise<void>;

  /**
   * Get or create conversation by username
   */
  getConversationByUsername: (username: string) => Promise<Conversation>;

  /**
   * Update conversation (for optimistic updates)
   */
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;

  /**
   * Fetch unread count
   */
  fetchUnreadCount: () => Promise<void>;
}

/**
 * Message Actions
 */
export interface MessageActions {
  /**
   * Fetch messages for conversation
   */
  fetchMessages: (conversationId: string) => Promise<void>;

  /**
   * Load more messages (pagination)
   */
  loadMoreMessages: (conversationId: string) => Promise<void>;

  /**
   * Send message
   */
  sendMessage: (
    conversationId: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
    files?: Array<{ file: File; preview: string; type: 'image' | 'video' | 'file' }>
  ) => Promise<ChatMessage>;

  /**
   * Add incoming message (from WebSocket)
   */
  addIncomingMessage: (message: ChatMessage) => void;

  /**
   * Mark conversation as read
   */
  markAsRead: (conversationId: string) => Promise<void>;

  /**
   * Mark all messages in conversation as read (for WebSocket read_update event)
   */
  markConversationMessagesAsRead: (conversationId: string, readAt: string) => void;

  /**
   * Update conversation unread count (for WebSocket events)
   */
  updateConversationUnreadCount: (conversationId: string, unreadCount: number) => void;

  /**
   * Update message status (for optimistic updates)
   */
  updateMessageStatus: (messageId: string, status: 'sending' | 'sent' | 'failed') => void;

  /**
   * Update message media (for video encoding progress/completion)
   */
  updateMessageMedia: (conversationId: string, messageId: string, media: any) => void;
}

/**
 * Online Status Actions
 */
export interface OnlineStatusActions {
  /**
   * Set active conversation
   */
  setActiveConversation: (conversationId: string | null) => void;

  /**
   * Update user online status
   */
  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void;

  /**
   * Set typing indicator
   */
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  /**
   * Clear all data (logout)
   */
  clearChatData: () => void;
}

/**
 * Chat State
 * รวม state + actions ทั้งหมด
 */
export interface ChatState {
  // ==========================================================================
  // STATE
  // ==========================================================================

  /**
   * รายการ conversations
   */
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsHasMore: boolean;
  conversationsNextCursor?: string;

  /**
   * Messages แยกตาม conversationId
   */
  messagesByConversation: Record<string, MessageState>;

  /**
   * Current active conversation
   */
  activeConversationId: string | null;

  /**
   * Online users (userId: boolean)
   */
  onlineUsers: Record<string, boolean>;

  /**
   * Unread count
   */
  unreadCount: number;

  /**
   * Typing indicators (conversationId: userId)
   */
  typingUsers: Record<string, Set<string>>;

  // ==========================================================================
  // ACTIONS
  // ==========================================================================
}

/**
 * Complete Chat State with Actions
 */
export type ChatStoreState = ChatState & ConversationActions & MessageActions & OnlineStatusActions;
