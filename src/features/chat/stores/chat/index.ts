// ============================================================================
// CHAT STORE - PUBLIC API
// ============================================================================

// Store
export { useChatStore } from './chatStore';

// Types
export type {
  MessageState,
  ConversationActions,
  MessageActions,
  OnlineStatusActions,
  ChatState,
  ChatStoreState,
} from './chatTypes';

// Selectors
export {
  useConversationMessages,
  useTypingUsers,
  useUserOnlineStatus,
  useUnreadCount,
  useActiveConversationId,
} from './chatSelectors';

// Helpers (if needed externally)
export * from './helpers/messageHelpers';
export * from './helpers/conversationHelpers';
