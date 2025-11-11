import { create } from 'zustand';
import type { ChatStoreState } from './chatTypes';
import { createConversationActions } from './actions/conversationActions';
import { createMessageActions } from './actions/messageActions';
import { createOnlineStatusActions } from './actions/onlineStatusActions';

// ============================================================================
// CHAT STORE
// ============================================================================

/**
 * Chat Store
 * จัดการ state สำหรับ Chat feature
 *
 * แยก actions ออกเป็นไฟล์ต่างหาก:
 * - conversationActions: การจัดการ conversations
 * - messageActions: การจัดการ messages
 * - onlineStatusActions: การจัดการ online status และ typing indicators
 */
export const useChatStore = create<ChatStoreState>()((set, get) => ({
  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  conversations: [],
  conversationsLoading: false,
  conversationsHasMore: false,
  conversationsNextCursor: undefined,
  messagesByConversation: {},
  activeConversationId: null,
  onlineUsers: {},
  unreadCount: 0,
  typingUsers: {},

  // ==========================================================================
  // ACTIONS (from external files)
  // ==========================================================================
  ...createConversationActions(set, get),
  ...createMessageActions(set, get),
  ...createOnlineStatusActions(set, get),
}));
