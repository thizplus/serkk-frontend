import type { StoreApi } from 'zustand';
import type { ChatStoreState, MessageActions } from '../chatTypes';
import type { ChatMessage } from '@/types/models';
import chatService from '../../../services/chat.service';
import mediaService from '@/lib/api/media.service';
import { toast } from 'sonner';
import { PAGINATION } from '@/config';
import { reverseMessages, generateTempMessageId, getMessageType } from '../helpers/messageHelpers';

/**
 * Create Message Actions
 */
export const createMessageActions = (
  set: StoreApi<ChatStoreState>['setState'],
  get: StoreApi<ChatStoreState>['getState']
): MessageActions => ({
  fetchMessages: async (conversationId: string) => {
    try {
      // Set loading state with default values
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            messages: [],
            hasMore: false,
            nextCursor: undefined,
            isLoading: true,
          },
        },
      }));

      console.log('🔄 fetchMessages called for:', conversationId);
      const response = await chatService.getMessages(conversationId, { limit: PAGINATION.MESSAGE_LIMIT });
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
       /* console.log('🔍 RAW response.data:', JSON.stringify(response.data, null, 2));
        console.log('🔍 response.data keys:', Object.keys(response.data));
        console.log('🔍 Has meta?', 'meta' in response.data);
        console.log('🔍 Has hasMore?', 'hasMore' in response.data);
        console.log('🔍 Has nextCursor?', 'nextCursor' in response.data);
*/
        // Support both response structures:
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
        const reversedMessages = reverseMessages(messages);

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
        limit: PAGINATION.MESSAGE_LIMIT,
      });

      console.log('📨 loadMoreMessages response:', response);

      if (response.success && response.data) {
        const messages = response.data.messages || [];

        // Support both response structures
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
              messages: [...reverseMessages(messages), ...messageState.messages],
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
    const tempId = generateTempMessageId();
    const messageType = getMessageType(formData);
    const content = formData.get('content') as string;
    const hasFiles = formData.has('media[]');

    // Get current user from localStorage (for optimistic update)
    const authStorage = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
    const currentUser = authStorage ? JSON.parse(authStorage).state?.user : null;

    try {
      // OPTIMISTIC UPDATE: Create temporary message with preview
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
        // Use preview URLs for immediate display
        media: files && files.length > 0 ? files.map(f => ({
          url: f.preview, // Use preview URL (blob:// or object URL)
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
        // ✅ NEW: Upload media to R2 first, then send message with media objects
        const mediaFiles = formData.getAll('media[]') as File[];
        const uploadedMedia: Array<{ url: string; type: string; mediaId: string }> = [];

        // Upload each file to R2
        for (const file of mediaFiles) {
          try {
            let uploadResult;
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');

            if (isImage) {
              uploadResult = await mediaService.uploadImage(file, onProgress, {
                sourceType: 'message',
                sourceId: conversationId,
              });
            } else if (isVideo) {
              uploadResult = await mediaService.uploadVideo(file, onProgress, {
                sourceType: 'message',
                sourceId: conversationId,
              });
            } else {
              uploadResult = await mediaService.uploadFile(file, onProgress, {
                sourceType: 'message',
                sourceId: conversationId,
              });
            }

            // ✅ Push media object (not just URL string)
            if (uploadResult.data) {
              uploadedMedia.push({
                url: uploadResult.data.url,
                type: uploadResult.data.type, // 'image', 'video', or 'file'
                mediaId: uploadResult.data.id, // UUID from backend
              });
            }
          } catch (uploadError) {
            console.error('Failed to upload file:', uploadError);
            throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
          }
        }

        // ✅ Send message with media array (not mediaUrls)
        response = await chatService.sendMessage(conversationId, {
          type: messageType as any,
          content: content || '', // Allow empty content if there's media
          media: uploadedMedia, // ✅ Changed from mediaUrls to media
        });
      }

      if (response.success && response.data) {
        const realMessage = response.data;

        // 🔍 DEBUG: Log response from backend
        console.log('📥 Received message response from backend:', {
          messageId: realMessage.id,
          type: realMessage.type,
          hasMedia: !!realMessage.media,
          media: realMessage.media,
        });

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

  updateMessageMedia: (conversationId: string, messageId: string, media: any) => {
    console.log(`🎬 Updating message media for message ${messageId} in conversation ${conversationId}`, media);

    set((state) => {
      const messageState = state.messagesByConversation[conversationId];
      if (!messageState) {
        console.warn(`⚠️ Conversation ${conversationId} not found in store`);
        return state;
      }

      const messageIndex = messageState.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        console.warn(`⚠️ Message ${messageId} not found in conversation ${conversationId}`);
        return state;
      }

      const currentMessage = messageState.messages[messageIndex];
      console.log(`🔍 Current message media:`, currentMessage.media);
      console.log(`🔍 Incoming media update:`, media);

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: messageState.messages.map((msg, idx) => {
              if (idx !== messageIndex) return msg;

              // Update media for this message
              if (!Array.isArray(msg.media)) {
                // No media yet, create array with new media
                console.log('📝 No existing media, creating new');
                return { ...msg, media: [media] };
              }

              // Update existing media
              let mediaUpdated = false;
              const updatedMedia = msg.media.map((m: any) => {
                // Try to match by id, mediaId, or videoId
                const isMatch =
                  (media.id && m.id === media.id) ||
                  (media.mediaId && m.mediaId === media.mediaId) ||
                  (media.videoId && m.videoId === media.videoId);

                if (isMatch) {
                  mediaUpdated = true;
                  console.log('✅ Found matching media, updating:', { old: m, new: media });
                  return { ...m, ...media };
                }
                return m;
              });

              // If no match found (no id in payload), update first video media
              if (!mediaUpdated && msg.media.length > 0) {
                console.log('⚠️ No ID match, updating first video media');
                const firstVideoIndex = msg.media.findIndex((m: any) => m.type === 'video');
                if (firstVideoIndex !== -1) {
                  updatedMedia[firstVideoIndex] = {
                    ...msg.media[firstVideoIndex],
                    ...media,
                  };
                  console.log('✅ Updated first video at index', firstVideoIndex);
                }
              }

              return { ...msg, media: updatedMedia };
            }),
          },
        },
      };
    });
  },
});
