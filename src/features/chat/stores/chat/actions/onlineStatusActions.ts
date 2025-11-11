import type { StoreApi } from 'zustand';
import type { ChatStoreState, OnlineStatusActions } from '../chatTypes';

/**
 * Create Online Status Actions
 */
export const createOnlineStatusActions = (
  set: StoreApi<ChatStoreState>['setState'],
  get: StoreApi<ChatStoreState>['getState']
): OnlineStatusActions => ({
  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => {
    console.log(`🔄 updateUserOnlineStatus: userId=${userId}, isOnline=${isOnline}, lastSeen=${lastSeen}`);

    set((state) => {
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.otherUser.id === userId) {
          console.log(`  ✅ Updated conversation ${conv.id}: ${conv.otherUser.displayName} → ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
          return {
            ...conv,
            otherUser: {
              ...conv.otherUser,
              isOnline,
              lastSeen: lastSeen || conv.otherUser.lastSeen,
            },
          };
        }
        return conv;
      });

      return {
        onlineUsers: {
          ...state.onlineUsers,
          [userId]: isOnline,
        },
        conversations: updatedConversations,
      };
    });
  },

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => {
    set((state) => {
      const typingSet = state.typingUsers[conversationId] || new Set<string>();

      if (isTyping) {
        typingSet.add(userId);
      } else {
        typingSet.delete(userId);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: new Set(typingSet),
        },
      };
    });
  },

  clearChatData: () => {
    set({
      conversations: [],
      conversationsLoading: false,
      conversationsHasMore: false,
      conversationsNextCursor: undefined,
      messagesByConversation: {},
      activeConversationId: null,
      onlineUsers: {},
      unreadCount: 0,
      typingUsers: {},
    });
  },
});
