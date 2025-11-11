// ============================================================================
// Chat Service
// จัดการการเรียก API ที่เกี่ยวกับ Chat (Conversations, Messages, Blocks)
// ============================================================================

import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type {
  GetConversationsParams,
  GetMessagesParams,
  SendMessageRequest,
  MarkAsReadRequest,
} from '@/types/request';
import type {
  GetConversationsResponse,
  GetConversationByUsernameResponse,
  SearchChatUsersResponse,
  GetMessagesResponse,
  SendMessageResponse,
  MarkChatAsReadResponse,
  GetChatUnreadCountResponse,
  BlockUserResponse,
  UnblockUserResponse,
  GetBlockedUsersResponse,
  GetMessageResponse,
  GetMessageContextResponse,
  GetConversationMediaResponse,
} from '@/types/response';

// ============================================================================
// CHAT SERVICE
// ============================================================================

/**
 * Chat Service
 * จัดการการเรียก API สำหรับ Chat feature
 */
const chatService = {
  // ==========================================================================
  // SEARCH
  // ==========================================================================

  /**
   * Search users for chat (excludes self and blocked users)
   * @param query - Search query
   * @param limit - Number of results
   * @returns Promise<SearchChatUsersResponse>
   */
  searchUsers: async (
    query?: string,
    limit: number = 20
  ): Promise<SearchChatUsersResponse> => {
    try {
      return await apiService.get<SearchChatUsersResponse>(
        API.CHAT.SEARCH_USERS,
        { q: query, limit }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถค้นหาผู้ใช้ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถค้นหาผู้ใช้ได้');
    }
  },

  // ==========================================================================
  // CONVERSATIONS
  // ==========================================================================

  /**
   * Get all conversations
   * @param params - cursor, limit
   * @returns Promise<GetConversationsResponse>
   */
  getConversations: async (
    params?: GetConversationsParams
  ): Promise<GetConversationsResponse> => {
    try {
      return await apiService.get<GetConversationsResponse>(
        API.CHAT.CONVERSATIONS,
        params
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงรายการแชทได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงรายการแชทได้');
    }
  },

  /**
   * Get or create conversation with username
   * @param username - Username to chat with
   * @returns Promise<GetConversationByUsernameResponse>
   */
  getConversationByUsername: async (
    username: string
  ): Promise<GetConversationByUsernameResponse> => {
    try {
      return await apiService.get<GetConversationByUsernameResponse>(
        API.CHAT.CONVERSATION_BY_USERNAME(username)
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถเปิดแชทได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถเปิดแชทได้');
    }
  },

  /**
   * Get unread count
   * @returns Promise<GetChatUnreadCountResponse>
   */
  getUnreadCount: async (): Promise<GetChatUnreadCountResponse> => {
    try {
      return await apiService.get<GetChatUnreadCountResponse>(
        API.CHAT.UNREAD_COUNT
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่าน: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงจำนวนข้อความที่ยังไม่ได้อ่าน');
    }
  },

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  /**
   * Get messages in conversation
   * @param conversationId - Conversation ID
   * @param params - cursor, limit
   * @returns Promise<GetMessagesResponse>
   */
  getMessages: async (
    conversationId: string,
    params?: GetMessagesParams
  ): Promise<GetMessagesResponse> => {
    try {
      return await apiService.get<GetMessagesResponse>(
        API.CHAT.MESSAGES(conversationId),
        params
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงข้อความได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงข้อความได้');
    }
  },

  /**
   * Send message (supports both JSON and FormData)
   * @param conversationId - Conversation ID
   * @param data - SendMessageRequest (JSON) or FormData (for media)
   * @param onProgress - Optional progress callback (only for FormData)
   * @returns Promise<SendMessageResponse>
   *
   * @example Text message (JSON)
   * sendMessage(conversationId, { type: "text", content: "Hello" })
   *
   * @example Video message (FormData)
   * const formData = new FormData();
   * formData.append("type", "video");
   * formData.append("content", "Check this video!");
   * formData.append("media[]", videoFile);
   * sendMessage(conversationId, formData)
   */
  sendMessage: async (
    conversationId: string,
    data: SendMessageRequest | FormData,
    onProgress?: (progress: number) => void
  ): Promise<SendMessageResponse> => {
    try {
      // Check if data is FormData (multipart upload for media)
      if (data instanceof FormData) {
        // Multipart upload (for video/image/file messages)
        return await apiService.upload<SendMessageResponse>(
          API.CHAT.SEND_MESSAGE(conversationId),
          data,
          onProgress
        );
      } else {
        // JSON request (for text messages)
        return await apiService.post<SendMessageResponse>(
          API.CHAT.SEND_MESSAGE(conversationId),
          data
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถส่งข้อความได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถส่งข้อความได้');
    }
  },

  /**
   * Send text message
   * @param conversationId - Conversation ID
   * @param content - Message content
   * @returns Promise<SendMessageResponse>
   * @deprecated Use sendMessage() instead
   */
  sendTextMessage: async (
    conversationId: string,
    content: string
  ): Promise<SendMessageResponse> => {
    return chatService.sendMessage(conversationId, {
      type: 'text',
      content,
    });
  },

  /**
   * Send media message (with files)
   * @param conversationId - Conversation ID
   * @param formData - FormData with type, content, media[]
   * @param onProgress - Optional progress callback
   * @returns Promise<SendMessageResponse>
   * @deprecated Use sendMessage() instead
   */
  sendMediaMessage: async (
    conversationId: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<SendMessageResponse> => {
    return chatService.sendMessage(conversationId, formData, onProgress);
  },

  /**
   * Mark conversation as read
   * @param conversationId - Conversation ID
   * @returns Promise<MarkChatAsReadResponse>
   */
  markAsRead: async (
    conversationId: string
  ): Promise<MarkChatAsReadResponse> => {
    try {
      return await apiService.post<MarkChatAsReadResponse>(
        API.CHAT.MARK_AS_READ(conversationId),
        {}
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว: ${error.message}`);
      }
      throw new Error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว');
    }
  },

  /**
   * Get single message by ID
   * @param messageId - Message ID
   * @returns Promise<GetMessageResponse>
   */
  getMessage: async (messageId: string): Promise<GetMessageResponse> => {
    try {
      return await apiService.get<GetMessageResponse>(
        API.CHAT.GET_MESSAGE(messageId)
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงข้อความได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงข้อความได้');
    }
  },

  /**
   * Get message context (surrounding messages)
   * @param messageId - Message ID
   * @param limit - Number of messages before/after (default: 20)
   * @returns Promise<GetMessageContextResponse>
   */
  getMessageContext: async (
    messageId: string,
    limit: number = 20
  ): Promise<GetMessageContextResponse> => {
    try {
      return await apiService.get<GetMessageContextResponse>(
        API.CHAT.GET_MESSAGE_CONTEXT(messageId),
        { limit }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงบริบทข้อความได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงบริบทข้อความได้');
    }
  },

  // ==========================================================================
  // MEDIA QUERIES (Phase 2)
  // ==========================================================================

  /**
   * Get media files in conversation
   * @param conversationId - Conversation ID
   * @param params - cursor, limit, mediaType
   * @returns Promise<GetConversationMediaResponse>
   */
  getConversationMedia: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number; mediaType?: 'image' | 'video' | 'file' }
  ): Promise<GetConversationMediaResponse> => {
    try {
      return await apiService.get<GetConversationMediaResponse>(
        API.CHAT.GET_MEDIA(conversationId),
        params
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงไฟล์สื่อได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงไฟล์สื่อได้');
    }
  },

  /**
   * Get links in conversation (Phase 2)
   * @param conversationId - Conversation ID
   * @param params - cursor, limit
   * @returns Promise<any>
   */
  getConversationLinks: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<any> => {
    try {
      return await apiService.get(
        API.CHAT.GET_LINKS(conversationId),
        params
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงลิงก์ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงลิงก์ได้');
    }
  },

  /**
   * Get files in conversation (Phase 2)
   * @param conversationId - Conversation ID
   * @param params - cursor, limit
   * @returns Promise<any>
   */
  getConversationFiles: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<any> => {
    try {
      return await apiService.get(
        API.CHAT.GET_FILES(conversationId),
        params
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงไฟล์ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงไฟล์ได้');
    }
  },

  // ==========================================================================
  // BLOCKS
  // ==========================================================================

  /**
   * Block user
   * @param username - Username to block
   * @returns Promise<BlockUserResponse>
   */
  blockUser: async (username: string): Promise<BlockUserResponse> => {
    try {
      return await apiService.post<BlockUserResponse>(
        API.CHAT.BLOCK_USER,
        { username }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถบล็อกผู้ใช้ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถบล็อกผู้ใช้ได้');
    }
  },

  /**
   * Unblock user
   * @param username - Username to unblock
   * @returns Promise<UnblockUserResponse>
   */
  unblockUser: async (username: string): Promise<UnblockUserResponse> => {
    try {
      return await apiService.delete<UnblockUserResponse>(
        API.CHAT.UNBLOCK_USER(username)
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถปลดบล็อกผู้ใช้ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถปลดบล็อกผู้ใช้ได้');
    }
  },

  /**
   * Get blocked users
   * @returns Promise<GetBlockedUsersResponse>
   */
  getBlockedUsers: async (): Promise<GetBlockedUsersResponse> => {
    try {
      return await apiService.get<GetBlockedUsersResponse>(
        API.CHAT.GET_BLOCKS
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงรายการผู้ใช้ที่ถูกบล็อก: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงรายการผู้ใช้ที่ถูกบล็อก');
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default chatService;
