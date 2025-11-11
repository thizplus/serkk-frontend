import type { MessageState } from './chatTypes';
import { useChatStore } from './chatStore';

/**
 * Default empty message state (cached to prevent infinite loops)
 */
const EMPTY_MESSAGE_STATE: MessageState = {
  messages: [],
  hasMore: false,
  isLoading: false,
};

/**
 * Get messages for a conversation
 *
 * @param conversationId - The conversation ID
 * @returns Message state for the conversation
 */
export const useConversationMessages = (conversationId: string) => {
  return useChatStore((state) => {
    // Return default state for empty conversationId
    if (!conversationId || conversationId === "") {
      return EMPTY_MESSAGE_STATE;
    }
    // Return existing state or default (cached reference)
    return state.messagesByConversation[conversationId] || EMPTY_MESSAGE_STATE;
  });
};

/**
 * Get typing users for a conversation
 *
 * @param conversationId - The conversation ID
 * @returns Set of user IDs who are currently typing
 */
export const useTypingUsers = (conversationId: string) => {
  return useChatStore((state) => state.typingUsers[conversationId] || new Set<string>());
};

/**
 * Get online status for a specific user
 *
 * @param userId - The user ID
 * @returns Whether the user is online
 */
export const useUserOnlineStatus = (userId: string) => {
  return useChatStore((state) => state.onlineUsers[userId] || false);
};

/**
 * Get total unread count
 */
export const useUnreadCount = () => {
  return useChatStore((state) => state.unreadCount);
};

/**
 * Get active conversation ID
 */
export const useActiveConversationId = () => {
  return useChatStore((state) => state.activeConversationId);
};
