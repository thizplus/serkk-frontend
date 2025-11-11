import type { Conversation } from '@/shared/types/models';

/**
 * Sort conversations by last message date (descending)
 */
export const sortConversations = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const aDate = a.lastMessage?.createdAt || a.updatedAt;
    const bDate = b.lastMessage?.createdAt || b.updatedAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
};

/**
 * Calculate total unread count from conversations
 */
export const calculateTotalUnreadCount = (conversations: Conversation[]): number => {
  return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
};

/**
 * Find conversation by ID
 */
export const findConversationById = (
  conversations: Conversation[],
  conversationId: string
): Conversation | undefined => {
  return conversations.find((c) => c.id === conversationId);
};

/**
 * Find conversation by username
 */
export const findConversationByUsername = (
  conversations: Conversation[],
  username: string
): Conversation | undefined => {
  return conversations.find((c) => c.otherUser?.username === username);
};

/**
 * Update conversation in list
 */
export const updateConversationInList = (
  conversations: Conversation[],
  conversationId: string,
  updates: Partial<Conversation>
): Conversation[] => {
  return conversations.map((conv) =>
    conv.id === conversationId ? { ...conv, ...updates } : conv
  );
};

/**
 * Merge conversation online status
 * ใช้สำหรับ merge online status จาก store กับ API
 */
export const mergeConversationOnlineStatus = (
  conversation: any,
  currentOnlineUsers: Record<string, boolean>
): Conversation => {
  const userId = conversation.otherUser?.id;
  if (!userId) return conversation;

  const isOnlineFromStore = currentOnlineUsers[userId];
  const isOnlineFromAPI = conversation.otherUser?.isOnline;

  return {
    ...conversation,
    otherUser: {
      ...conversation.otherUser,
      isOnline: isOnlineFromStore !== undefined ? isOnlineFromStore : isOnlineFromAPI,
    },
  };
};
