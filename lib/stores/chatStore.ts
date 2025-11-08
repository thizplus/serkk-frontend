import { create } from 'zustand';
import type { Conversation, ChatMessage } from '@/lib/types/models';
import chatService from '@/lib/services/api/chat.service';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface MessageState {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  isLoading: boolean;
}

interface ChatState {
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
  // ACTIONS - CONVERSATIONS
  // ==========================================================================

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

  // ==========================================================================
  // ACTIONS - MESSAGES
  // ==========================================================================

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

  // ==========================================================================
  // ACTIONS - ONLINE STATUS
  // ==========================================================================

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

// ============================================================================
// STORE
// ============================================================================

/**
 * Chat Store
 * จัดการ state สำหรับ Chat feature
 */
export const useChatStore = create<ChatState>()((set, get) => ({
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
  // CONVERSATIONS ACTIONS
  // ==========================================================================

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

      const response = await chatService.getConversations({ limit: 20 });

      console.log('📥 Conversations response:', response);

      if (response.success && response.data) {
        // Defensive checks for meta
        const meta = response.data.meta || { hasMore: false, nextCursor: undefined };

        // Get current online users from store (to prevent overwriting WebSocket updates)
        const currentState = get();
        const currentOnlineUsers = currentState.onlineUsers || {};

        // Merge conversations with current online status
        const conversations = (response.data.conversations || []).map((conv: any) => {
          if (conv.otherUser) {
            const userId = conv.otherUser.id;

            // ✅ ใช้ online status จาก store ถ้ามี (จาก WebSocket)
            // ถ้าไม่มีใน store ใช้จาก API response
            // ถ้าไม่มีทั้งคู่ ค่อยใช้ default false
            const isOnlineFromStore = currentOnlineUsers[userId];
            const isOnlineFromAPI = conv.otherUser.isOnline;

            conv.otherUser.isOnline =
              typeof isOnlineFromStore !== 'undefined'
                ? isOnlineFromStore
                : (typeof isOnlineFromAPI !== 'undefined' ? isOnlineFromAPI : false);

            // Set default lastSeen if not provided
            if (!conv.otherUser.lastSeen) {
              conv.otherUser.lastSeen = new Date().toISOString();
            }
          }
          return conv;
        });

        // ✅ คำนวณ total unread count จาก conversations
        const totalUnread = conversations.reduce((sum: number, conv: any) => {
          return sum + (conv.unreadCount || 0);
        }, 0);

        console.log('📊 Total unread count:', totalUnread);

        set({
          conversations,
          conversationsHasMore: meta.hasMore || false,
          conversationsNextCursor: meta.nextCursor,
          conversationsLoading: false,
          unreadCount: totalUnread, // ✅ Set จาก conversations
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
        limit: 20,
      });

      if (response.success && response.data) {
        // Get current online users from store (to prevent overwriting WebSocket updates)
        const currentState = get();
        const currentOnlineUsers = currentState.onlineUsers || {};

        // Merge new conversations with current online status
        const newConversations = (response.data.conversations || []).map((conv: any) => {
          if (conv.otherUser) {
            const userId = conv.otherUser.id;

            // ✅ ใช้ online status จาก store ถ้ามี (จาก WebSocket)
            const isOnlineFromStore = currentOnlineUsers[userId];
            const isOnlineFromAPI = conv.otherUser.isOnline;

            conv.otherUser.isOnline =
              typeof isOnlineFromStore !== 'undefined'
                ? isOnlineFromStore
                : (typeof isOnlineFromAPI !== 'undefined' ? isOnlineFromAPI : false);

            if (!conv.otherUser.lastSeen) {
              conv.otherUser.lastSeen = new Date().toISOString();
            }
          }
          return conv;
        });

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

  // ==========================================================================
  // MESSAGES ACTIONS
  // ==========================================================================

  fetchMessages: async (conversationId: string) => {
    try {
      // ✅ Set loading state with default values
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            messages: [],
            hasMore: false, // ✅ Set default to prevent undefined
            nextCursor: undefined,
            isLoading: true,
          },
        },
      }));

      console.log('🔄 fetchMessages called for:', conversationId);
      const response = await chatService.getMessages(conversationId, { limit: 50 });
      console.log('📥 fetchMessages API response received:', {
        success: response.success,
        hasData: !!response.data,
        messageCount: response.data?.messages?.length || 0,
      });

      console.log('📨 fetchMessages response:', response);

      if (response.success && response.data) {
        // Defensive checks for response structure
        const messages = response.data.messages || [];

        // 🔍 DEBUG: Log raw response.data
        console.log('🔍 RAW response.data:', JSON.stringify(response.data, null, 2));
        console.log('🔍 response.data keys:', Object.keys(response.data));
        console.log('🔍 Has meta?', 'meta' in response.data);
        console.log('🔍 Has hasMore?', 'hasMore' in response.data);
        console.log('🔍 Has nextCursor?', 'nextCursor' in response.data);

        // ✅ Support both response structures:
        // 1. { messages, meta: { hasMore, nextCursor } }
        // 2. { messages, hasMore, nextCursor }
        let hasMore: boolean;
        let nextCursor: string | undefined;

        if ('meta' in response.data && response.data.meta) {
          // Structure 1: has meta object
          console.log('🔍 Using meta structure');
          hasMore = response.data.meta.hasMore || false;
          nextCursor = response.data.meta.nextCursor;
        } else {
          // Structure 2: direct properties
          console.log('🔍 Using direct properties structure');
          hasMore = (response.data as any).hasMore || false;
          nextCursor = (response.data as any).nextCursor;
        }

        console.log('📨 Messages count:', messages.length);
        console.log('📨 First message (before reverse):', messages[0]?.content, messages[0]?.createdAt);
        console.log('📨 Last message (before reverse):', messages[messages.length - 1]?.content, messages[messages.length - 1]?.createdAt);
        console.log('📨 Pagination FINAL:', { hasMore, nextCursor: nextCursor ? nextCursor.substring(0, 20) + '...' : 'none' });

        // Reverse messages for display (oldest first, newest last)
        const reversedMessages = [...messages].reverse();

        console.log('📨 After reverse - First:', reversedMessages[0]?.content, reversedMessages[0]?.createdAt);
        console.log('📨 After reverse - Last:', reversedMessages[reversedMessages.length - 1]?.content, reversedMessages[reversedMessages.length - 1]?.createdAt);

        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              messages: reversedMessages,
              hasMore: hasMore,
              nextCursor: nextCursor,
              isLoading: false,
            },
          },
        }));
      } else {
        console.warn('⚠️ fetchMessages response not successful or no data:', response);
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              messages: [],
              hasMore: false,
              isLoading: false,
            },
          },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...(state.messagesByConversation[conversationId] || {}),
            isLoading: false,
          },
        },
      }));
      toast.error('ไม่สามารถโหลดข้อความได้');
    }
  },

  loadMoreMessages: async (conversationId: string) => {
    const messageState = get().messagesByConversation[conversationId];

    if (!messageState || !messageState.hasMore || !messageState.nextCursor) {
      console.log('⚠️ Cannot load more:', {
        hasMessageState: !!messageState,
        hasMore: messageState?.hasMore,
        hasCursor: !!messageState?.nextCursor,
      });
      return;
    }

    try {
      console.log('🔄 loadMoreMessages - Fetching with cursor:', messageState.nextCursor);

      const response = await chatService.getMessages(conversationId, {
        cursor: messageState.nextCursor,
        limit: 50,
      });

      console.log('📨 loadMoreMessages response:', response);

      if (response.success && response.data) {
        const messages = response.data.messages || [];

        // ✅ Support both response structures
        let hasMore: boolean;
        let nextCursor: string | undefined;

        if ('meta' in response.data && response.data.meta) {
          hasMore = response.data.meta.hasMore || false;
          nextCursor = response.data.meta.nextCursor;
        } else {
          hasMore = (response.data as any).hasMore || false;
          nextCursor = (response.data as any).nextCursor;
        }

        console.log('✅ loadMoreMessages - Loaded:', {
          newMessagesCount: messages.length,
          hasMore,
          nextCursor: nextCursor ? 'exists' : 'none',
        });

        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              ...messageState,
              messages: [...messages.reverse(), ...messageState.messages],
              hasMore: hasMore,
              nextCursor: nextCursor,
            },
          },
        }));
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      toast.error('ไม่สามารถโหลดข้อความเพิ่มเติมได้');
    }
  },

  sendMessage: async (conversationId: string, formData: FormData, onProgress?, files?) => {
    // Generate temporary message ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const messageType = formData.get('type') as string;
    const content = formData.get('content') as string;
    const hasFiles = formData.has('media[]');

    // Get current user from localStorage (for optimistic update)
    const authStorage = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    const currentUser = authStorage ? JSON.parse(authStorage).state?.user : null;

    try {
      // ✅ OPTIMISTIC UPDATE: Create temporary message with preview
      const tempMessage: ChatMessage = {
        id: tempId,
        conversationId,
        type: messageType as any,
        content: content || '',
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar,
        } : {} as any,
        // ✅ Use preview URLs for immediate display
        media: files && files.length > 0 ? files.map(f => ({
          url: f.preview, // ✅ Use preview URL (blob:// or object URL)
          type: f.type,
          thumbnail: f.type === 'video' ? f.preview : undefined,
        })) : undefined,
      };

      // Add temporary message to state immediately
      set((state) => {
        const messageState = state.messagesByConversation[conversationId] || {
          messages: [],
          hasMore: false,
          isLoading: false,
        };

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              ...messageState,
              messages: [...messageState.messages, tempMessage],
            },
          },
        };
      });

      // Update conversation's last message (optimistic)
      get().updateConversation(conversationId, {
        lastMessage: {
          id: tempId,
          type: tempMessage.type,
          content: tempMessage.content || (hasFiles ? 'กำลังส่ง...' : ''),
          createdAt: tempMessage.createdAt,
        },
        updatedAt: tempMessage.createdAt,
      });

      // Send API request in background
      let response;

      if (messageType === 'text' && !hasFiles) {
        // Text message - send as JSON
        response = await chatService.sendTextMessage(conversationId, content);
      } else {
        // Media message - send as multipart/form-data
        response = await chatService.sendMediaMessage(conversationId, formData, onProgress);
      }

      if (response.success && response.data) {
        const realMessage = response.data;

        // Replace temporary message with real message
        set((state) => {
          const messageState = state.messagesByConversation[conversationId];
          if (!messageState) return state;

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: {
                ...messageState,
                messages: messageState.messages.map((msg) =>
                  msg.id === tempId ? realMessage : msg
                ),
              },
            },
          };
        });

        // Update conversation's last message with real data
        get().updateConversation(conversationId, {
          lastMessage: {
            id: realMessage.id,
            type: realMessage.type,
            content: realMessage.content,
            createdAt: realMessage.createdAt,
          },
          updatedAt: realMessage.createdAt,
        });

        return realMessage;
      }

      throw new Error('Failed to send message');
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove temporary message on error
      set((state) => {
        const messageState = state.messagesByConversation[conversationId];
        if (!messageState) return state;

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              ...messageState,
              messages: messageState.messages.filter((msg) => msg.id !== tempId),
            },
          },
        };
      });

      toast.error('ไม่สามารถส่งข้อความได้');
      throw error;
    }
  },

  addIncomingMessage: (message: ChatMessage) => {
    const { conversationId } = message;

    console.log('🔍 addIncomingMessage called:', {
      messageId: message.id,
      conversationId,
      type: message.type,
      content: message.content,
    });

    set((state) => {
      const messageState = state.messagesByConversation[conversationId] || {
        messages: [],
        hasMore: false,
        isLoading: false,
      };

      // Check if message already exists
      const exists = messageState.messages.find((m) => m.id === message.id);
      if (exists) {
        console.log('⚠️ Message already exists, skipping:', message.id);
        return state;
      }

      // Check if this is the active conversation
      const isActiveConversation = state.activeConversationId === conversationId;

      console.log('✅ Adding message to conversation:', {
        conversationId,
        messageId: message.id,
        isActiveConversation,
        activeConversationId: state.activeConversationId,
        messageCount: messageState.messages.length,
      });

      // Update messages
      const newState: any = {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: [...messageState.messages, message],
          },
        },
      };

      // Update conversation's last message
      // Only increment unread count if NOT in active conversation
      newState.conversations = state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: {
                id: message.id,
                type: message.type,
                content: message.content,
                createdAt: message.createdAt,
              },
              unreadCount: isActiveConversation ? conv.unreadCount : conv.unreadCount + 1,
              updatedAt: message.createdAt,
            }
          : conv
      );

      // Only increment global unread count if NOT in active conversation
      if (!isActiveConversation) {
        newState.unreadCount = state.unreadCount + 1;
      }

      return newState;
    });
  },

  markAsRead: async (conversationId: string) => {
    try {
      await chatService.markAsRead(conversationId);

      // Update conversation unread count
      set((state) => {
        const conversation = state.conversations.find((c) => c.id === conversationId);
        const unreadDecrement = conversation?.unreadCount || 0;

        return {
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
          unreadCount: Math.max(0, state.unreadCount - unreadDecrement),
        };
      });

      // Mark all messages as read
      set((state) => {
        const messageState = state.messagesByConversation[conversationId];
        if (!messageState) return state;

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              ...messageState,
              messages: messageState.messages.map((msg) => ({ ...msg, isRead: true })),
            },
          },
        };
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  updateMessageStatus: (messageId: string, status: 'sending' | 'sent' | 'failed') => {
    set((state) => {
      const updatedMessages = { ...state.messagesByConversation };

      Object.keys(updatedMessages).forEach((convId) => {
        const messageState = updatedMessages[convId];
        const messageIndex = messageState.messages.findIndex((m) => m.id === messageId);

        if (messageIndex !== -1) {
          updatedMessages[convId] = {
            ...messageState,
            messages: messageState.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status } : msg
            ) as any,
          };
        }
      });

      return { messagesByConversation: updatedMessages };
    });
  },

  markConversationMessagesAsRead: (conversationId: string, readAt: string) => {
    console.log(`📖 Marking all messages as read in conversation: ${conversationId}`);

    set((state) => {
      const messageState = state.messagesByConversation[conversationId];
      if (!messageState) return state;

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: messageState.messages.map((msg) => ({
              ...msg,
              isRead: true,
              readAt: readAt,
            })),
          },
        },
      };
    });
  },

  updateConversationUnreadCount: (conversationId: string, unreadCount: number) => {
    console.log(`📊 Updating unread count for conversation ${conversationId}: ${unreadCount}`);

    set((state) => {
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (!conversation) return state;

      const oldUnreadCount = conversation.unreadCount || 0;
      const diff = unreadCount - oldUnreadCount;

      return {
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, unreadCount }
            : conv
        ),
        unreadCount: Math.max(0, state.unreadCount + diff),
      };
    });
  },

  // ==========================================================================
  // ONLINE STATUS ACTIONS
  // ==========================================================================

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
}));

// ============================================================================
// SELECTORS (for better performance)
// ============================================================================

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
 */
export const useTypingUsers = (conversationId: string) => {
  return useChatStore((state) => state.typingUsers[conversationId] || new Set<string>());
};
