import type { StoreApi } from 'zustand';
import type { ChatStoreState, ConversationActions } from '../chatTypes';
import type { Conversation } from '@/types/models';
import chatService from '../../../services/chat.service';
import { toast } from 'sonner';
import { PAGINATION } from '@/config';
import { calculateTotalUnreadCount, mergeConversationOnlineStatus } from '../helpers/conversationHelpers';

/**
 * Create Conversation Actions
 */
export const createConversationActions = (
  set: StoreApi<ChatStoreState>['setState'],
  get: StoreApi<ChatStoreState>['getState']
): ConversationActions => ({
  fetchConversations: async () => {
    try {
      set({ conversationsLoading: true });

      // Check if user is authenticated
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.warn('⚠️ No auth token found, cannot fetch conversations');
          set({
            conversations: [],
            conversationsLoading: false,
            unreadCount: 0,
          });
          return;
        }
      }

      const response = await chatService.getConversations({ limit: PAGINATION.DEFAULT_LIMIT });

      console.log('📥 Conversations response:', response);

      if (response.success && response.data) {
        // Defensive checks for meta
        const meta = response.data.meta || { hasMore: false, nextCursor: undefined };

        // Get current online users from store (to prevent overwriting WebSocket updates)
        const currentState = get();
        const currentOnlineUsers = currentState.onlineUsers || {};

        // Merge conversations with current online status
        const conversations = (response.data.conversations || []).map((conv: any) =>
          mergeConversationOnlineStatus(conv, currentOnlineUsers)
        );

        // Calculate total unread count from conversations
        const totalUnread = calculateTotalUnreadCount(conversations);

        console.log('📊 Total unread count:', totalUnread);

        set({
          conversations,
          conversationsHasMore: meta.hasMore || false,
          conversationsNextCursor: meta.nextCursor,
          conversationsLoading: false,
          unreadCount: totalUnread,
        });
      } else {
        // Handle case where response is not successful
        console.warn('⚠️ Response not successful or no data:', response);
        set({
          conversations: [],
          conversationsLoading: false,
        });

        // Show error if it's an auth issue
        if (response.message?.includes('Unauthorized') || response.message?.includes('Invalid token')) {
          toast.error('กรุณาเข้าสู่ระบบก่อนใช้งานแชท');
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch conversations:', error);
      set({ conversationsLoading: false });

      // Check if it's an auth error
      if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
        toast.error('กรุณาเข้าสู่ระบบก่อนใช้งานแชท');
      } else {
        toast.error('ไม่สามารถโหลดรายการแชทได้');
      }
    }
  },

  loadMoreConversations: async () => {
    const { conversationsNextCursor, conversationsHasMore } = get();

    if (!conversationsHasMore || !conversationsNextCursor) return;

    try {
      const response = await chatService.getConversations({
        cursor: conversationsNextCursor,
        limit: PAGINATION.DEFAULT_LIMIT,
      });

      if (response.success && response.data) {
        // Get current online users from store (to prevent overwriting WebSocket updates)
        const currentState = get();
        const currentOnlineUsers = currentState.onlineUsers || {};

        // Merge new conversations with current online status
        const newConversations = (response.data.conversations || []).map((conv: any) =>
          mergeConversationOnlineStatus(conv, currentOnlineUsers)
        );

        set((state) => ({
          conversations: [...state.conversations, ...newConversations],
          conversationsHasMore: response.data!.meta.hasMore,
          conversationsNextCursor: response.data!.meta.nextCursor,
        }));
      }
    } catch (error) {
      console.error('Failed to load more conversations:', error);
      toast.error('ไม่สามารถโหลดรายการแชทเพิ่มเติมได้');
    }
  },

  getConversationByUsername: async (username: string) => {
    try {
      const response = await chatService.getConversationByUsername(username);

      console.log('🔍 getConversationByUsername response:', response);

      if (response.success && response.data) {
        // Handle both response structures:
        // 1. { data: { conversation: {...} } } (our expected type)
        // 2. { data: { id, otherUser, ... } } (backend might return directly)
        let conversation: any;

        if ('conversation' in response.data) {
          // Type 1: wrapped in conversation property
          conversation = response.data.conversation;
        } else if ('id' in response.data && 'otherUser' in response.data) {
          // Type 2: data IS the conversation
          conversation = response.data;
        } else {
          console.error('❌ Unexpected response structure:', response.data);
          throw new Error('Invalid conversation data structure from API');
        }

        // Validate conversation object
        if (!conversation || !conversation.id) {
          console.error('❌ Invalid conversation object:', conversation);
          throw new Error('Invalid conversation data from API');
        }

        // Set default values for online status if not present
        if (conversation.otherUser) {
          if (typeof conversation.otherUser.isOnline === 'undefined') {
            console.log('⚠️ API missing isOnline, setting default to false');
            conversation.otherUser.isOnline = false;
          }
          if (!conversation.otherUser.lastSeen) {
            console.log('⚠️ API missing lastSeen, setting default to now');
            conversation.otherUser.lastSeen = new Date().toISOString();
          }
        }

        console.log('✅ Valid conversation:', conversation);

        // Add to conversations list if not exists
        set((state) => {
          const exists = state.conversations.find((c) => c.id === conversation.id);
          if (!exists) {
            return {
              conversations: [conversation, ...state.conversations],
            };
          }
          return state;
        });

        return conversation;
      }

      throw new Error('Failed to get conversation');
    } catch (error) {
      console.error('Failed to get conversation by username:', error);
      toast.error('ไม่สามารถเปิดแชทได้');
      throw error;
    }
  },

  updateConversation: (conversationId: string, updates: Partial<Conversation>) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    }));
  },

  fetchUnreadCount: async () => {
    try {
      const response = await chatService.getUnreadCount();

      if (response.success && response.data) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },
});
