/**
 * WebSocket Message Router
 * Routes incoming messages to appropriate handlers
 */

import { useChatStore } from '../../stores/chat';
import { toast } from 'sonner';
import type {
  WebSocketMessage,
  ServerEvent,
  NewMessagePayload,
  MessageSentPayload,
  MessageReadUpdatePayload,
  MessageVideoUpdatedPayload,
  UserOnlinePayload,
  UserOfflinePayload,
  InitialOnlineStatusPayload,
  TypingNotificationPayload,
  ErrorPayload,
} from './types';
import { showBrowserNotification } from './notificationHandler';

/**
 * Route WebSocket message to appropriate handler
 */
export function routeMessage(data: WebSocketMessage): void {
  const { type, payload } = data;

  switch (type as ServerEvent) {
    case 'connection.success':
      console.log('🎉 Connection successful:', payload);
      break;

    case 'initial.online.status':
      handleInitialOnlineStatus(payload);
      break;

    case 'message.new':
      handleNewMessage(payload);
      break;

    case 'message.sent':
      handleMessageSent(payload);
      break;

    case 'message.read_ack':
      // Reader received acknowledgment (optional to handle)
      console.log('✅ Message read acknowledgment:', payload);
      break;

    case 'message.read_update':
      handleMessageReadUpdate(payload);
      break;

    case 'message.video.updated':
    case 'message.video.completed':
      handleMessageVideoUpdated(payload);
      break;

    case 'user.online':
      handleUserOnline(payload);
      break;

    case 'user.offline':
      handleUserOffline(payload);
      break;

    case 'typing.notification':
      handleTypingNotification(payload);
      break;

    case 'error':
      console.error('❌ WebSocket error:', payload);
      toast.error((payload as ErrorPayload)?.message || 'เกิดข้อผิดพลาด');
      break;

    default:
      // Unknown message type (not a chat event)
      console.warn('⚠️ Unknown chat WebSocket message type:', type);
      break;
  }
}

/**
 * Handle new message from another user
 */
function handleNewMessage(payload: NewMessagePayload): void {
  const { message } = payload;
  console.log('📬 New message:', message.id);

  const chatStore = useChatStore.getState();
  const isActiveConversation = chatStore.activeConversationId === message.conversationId;

  console.log('🔍 NEW_MESSAGE Event:', {
    messageId: message.id,
    conversationId: message.conversationId,
    activeConversationId: chatStore.activeConversationId,
    isActiveConversation,
  });

  // Add message to store
  chatStore.addIncomingMessage(message);

  if (isActiveConversation) {
    // ✅ อยู่ในแชท → auto-mark as read ทันที
    console.log('✅ Active conversation - auto marking as read');
    chatStore.markAsRead(message.conversationId);
  } else {
    // ❌ ไม่ได้อยู่ในแชท → ไม่แสดง toast (เพื่อไม่ให้บังปุ่ม)
    // แสดงแค่ browser notification ถ้า tab ซ่อนอยู่
    console.log('📬 New message received in inactive conversation');

    // Show browser notification if tab is hidden
    if (typeof document !== 'undefined' && document.hidden) {
      showBrowserNotification(message);
    }
  }
}

/**
 * Handle message sent confirmation (optimistic update)
 */
function handleMessageSent(payload: MessageSentPayload): void {
  const { message, tempId } = payload;
  console.log('✅ Message sent:', message.id);

  if (tempId) {
    // Replace temporary message with real message
    const chatStore = useChatStore.getState();
    chatStore.updateMessageStatus(tempId, 'sent');
  }
}

/**
 * Handle message read update (sender receives this when receiver reads)
 */
function handleMessageReadUpdate(payload: MessageReadUpdatePayload): void {
  const { conversationId, readBy, readAt } = payload;
  console.log('👁️ Messages read in conversation:', conversationId, 'by:', readBy, 'at:', readAt);

  // ✅ เช็คว่าใครเป็นคนอ่าน
  const chatStore = useChatStore.getState();
  const currentUser = localStorage.getItem('auth-storage');
  const currentUserId = currentUser ? JSON.parse(currentUser).state?.user?.id : null;

  console.log('🔍 READ_UPDATE Event:', {
    conversationId,
    readBy,
    currentUserId,
    shouldUpdate: readBy !== currentUserId,
  });

  // ❌ ถ้าเราเป็นคนอ่าน → ไม่ต้องทำอะไร (เพราะเรา mark as read ไปแล้ว)
  if (readBy === currentUserId) {
    console.log('⏭️ Skipping - We are the reader');
    return;
  }

  // ✅ ถ้าคนอื่นอ่านข้อความของเรา → update ว่าข้อความถูกอ่านแล้ว
  console.log('✅ Updating - Someone else read our messages');

  // Update all messages in this conversation as read
  chatStore.markConversationMessagesAsRead(conversationId, readAt);

  // Update conversation unread count to 0 (for sender's view)
  chatStore.updateConversationUnreadCount(conversationId, 0);
}

/**
 * Handle user online
 */
function handleUserOnline(payload: UserOnlinePayload): void {
  const { userId, lastSeen } = payload;
  console.log('🟢 User online:', userId);

  const chatStore = useChatStore.getState();
  chatStore.updateUserOnlineStatus(userId, true, lastSeen);
}

/**
 * Handle user offline
 */
function handleUserOffline(payload: UserOfflinePayload): void {
  const { userId, lastSeen } = payload;
  console.log('⚪ User offline:', userId);

  const chatStore = useChatStore.getState();
  chatStore.updateUserOnlineStatus(userId, false, lastSeen);
}

/**
 * Handle initial online status (sent when connecting)
 */
function handleInitialOnlineStatus(payload: InitialOnlineStatusPayload): void {
  const { users } = payload;
  console.log('📋 Initial online status received:', users.length, 'users');

  const chatStore = useChatStore.getState();

  // Update all users' online status in bulk
  users.forEach((user) => {
    console.log(`  ${user.isOnline ? '🟢' : '⚪'} ${user.userId} → ${user.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    chatStore.updateUserOnlineStatus(user.userId, user.isOnline, user.lastSeen);
  });

  console.log('✅ Initial online status applied');
}

/**
 * Handle message video encoding update
 */
function handleMessageVideoUpdated(payload: MessageVideoUpdatedPayload): void {
  const { conversationId, messageId, media } = payload;
  console.log('🎬 Message video updated:', {
    messageId,
    conversationId,
    encodingStatus: media.encodingStatus,
    encodingProgress: media.encodingProgress,
    hlsUrl: media.hlsUrl,
  });

  const chatStore = useChatStore.getState();

  // Update message media field in store
  chatStore.updateMessageMedia(conversationId, messageId, media);

  // Show toast when encoding completes
  if (media.encodingStatus === 'completed') {
    console.log('✅ Video encoding completed - ready to play');
    // Optional: Show success toast
    // toast.success('วิดีโอพร้อมเล่นแล้ว');
  } else if (media.encodingStatus === 'failed') {
    console.error('❌ Video encoding failed');
    toast.error('ประมวลผลวิดีโอล้มเหลว');
  }
}

/**
 * Handle typing notification
 */
function handleTypingNotification(payload: TypingNotificationPayload): void {
  const { conversationId, userId, isTyping } = payload;
  console.log(`⌨️  User ${isTyping ? 'started' : 'stopped'} typing:`, userId);

  const chatStore = useChatStore.getState();
  chatStore.setTyping(conversationId, userId, isTyping);
}
