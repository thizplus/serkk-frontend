// ============================================================================
// Chat WebSocket Service
// จัดการ WebSocket connection สำหรับ real-time messaging
// ============================================================================

import { useChatStore } from '@/lib/stores/chatStore';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types/models';

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketMessage {
  type: string;
  payload?: any;
}

// Server → Client Events
type ServerEvent =
  | 'connection.success'
  | 'initial.online.status'
  | 'message.sent'
  | 'message.new'
  | 'message.read_ack'
  | 'message.read_update'
  | 'user.online'
  | 'user.offline'
  | 'typing.notification'
  | 'error';

// Client → Server Events
type ClientEvent =
  | 'message.send'
  | 'message.read'
  | 'typing.start'
  | 'typing.stop'
  | 'ping';

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false; // ป้องกัน duplicate connection attempts

  constructor() {
    // Don't auto-connect, wait for explicit connect() call from ChatProvider
    console.log('🔧 ChatWebSocketClient instance created (not connected yet)');
  }

  /**
   * Get WebSocket URL from environment
   */
  private getWebSocketUrl(): string {
    // ✅ Correct URL: /chat/ws (NOT /ws/chat)
    const wsUrl = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:8080/chat/ws';
    return wsUrl;
  }

  /**
   * Get auth token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    const token = this.getAuthToken();

    if (!token) {
      console.warn('⚠️ No auth token found, skipping WebSocket connection');
      return;
    }

    // ป้องกัน duplicate connection attempts
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING || this.isConnecting) {
      console.log('⏳ WebSocket connection already in progress...');
      return;
    }

    try {
      this.isConnecting = true;
      const wsUrl = `${this.getWebSocketUrl()}?token=${token}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, 'TOKEN'));

      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(): void {
    console.log('✅ Chat WebSocket connected successfully');
    console.log('🔍 ReadyState:', this.ws?.readyState, 'OPEN =', WebSocket.OPEN);
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start ping interval (every 54 seconds)
    this.startPingInterval();

    // Send queued messages
    this.flushMessageQueue();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    console.log('📨 Raw WebSocket message received:', event.data);
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 Parsed message type:', data.type, 'payload:', data.payload);

      this.routeMessage(data);
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error, 'Raw:', event.data);
    }
  }

  /**
   * Route WebSocket message to appropriate handler
   */
  private routeMessage(data: WebSocketMessage): void {
    const { type, payload } = data;

    switch (type as ServerEvent) {
      case 'connection.success':
        console.log('🎉 Connection successful:', payload);
        break;

      case 'initial.online.status':
        this.handleInitialOnlineStatus(payload);
        break;

      case 'message.new':
        this.handleNewMessage(payload);
        break;

      case 'message.sent':
        this.handleMessageSent(payload);
        break;

      case 'message.read_ack':
        // Reader received acknowledgment (optional to handle)
        console.log('✅ Message read acknowledgment:', payload);
        break;

      case 'message.read_update':
        this.handleMessageReadUpdate(payload);
        break;

      case 'user.online':
        this.handleUserOnline(payload);
        break;

      case 'user.offline':
        this.handleUserOffline(payload);
        break;

      case 'typing.notification':
        this.handleTypingNotification(payload);
        break;

      case 'error':
        console.error('❌ WebSocket error:', payload);
        toast.error(payload?.message || 'เกิดข้อผิดพลาด');
        break;

      default:
        console.warn('⚠️ Unknown WebSocket message type:', type);
    }
  }

  /**
   * Handle new message from another user
   */
  private handleNewMessage(payload: { message: ChatMessage }): void {
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
        this.showBrowserNotification(message);
      }
    }
  }

  /**
   * Handle message sent confirmation (optimistic update)
   */
  private handleMessageSent(payload: { message: ChatMessage; tempId?: string }): void {
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
  private handleMessageReadUpdate(payload: { conversationId: string; readBy: string; readAt: string }): void {
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
  private handleUserOnline(payload: { userId: string; lastSeen: string }): void {
    const { userId, lastSeen } = payload;
    console.log('🟢 User online:', userId);

    const chatStore = useChatStore.getState();
    chatStore.updateUserOnlineStatus(userId, true, lastSeen);
  }

  /**
   * Handle user offline
   */
  private handleUserOffline(payload: { userId: string; lastSeen: string }): void {
    const { userId, lastSeen } = payload;
    console.log('⚪ User offline:', userId);

    const chatStore = useChatStore.getState();
    chatStore.updateUserOnlineStatus(userId, false, lastSeen);
  }

  /**
   * Handle initial online status (sent when connecting)
   */
  private handleInitialOnlineStatus(payload: {
    users: Array<{ userId: string; isOnline: boolean; lastSeen: string }>;
  }): void {
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
   * Handle typing notification
   */
  private handleTypingNotification(payload: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }): void {
    const { conversationId, userId, isTyping } = payload;
    console.log(`⌨️  User ${isTyping ? 'started' : 'stopped'} typing:`, userId);

    const chatStore = useChatStore.getState();
    chatStore.setTyping(conversationId, userId, isTyping);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event);
    console.error('🔍 Error details:', {
      type: event.type,
      target: event.target,
      readyState: this.ws?.readyState
    });
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(event: CloseEvent): void {
    console.log('🔌 Chat WebSocket closed:');
    console.log('  - Code:', event.code);
    console.log('  - Reason:', event.reason || '(no reason provided)');
    console.log('  - Clean:', event.wasClean);
    console.log('  - ReadyState before close:', this.ws?.readyState);

    this.isConnecting = false;
    this.stopPingInterval();

    // Check for specific error codes
    if (event.code === 1006) {
      console.warn('⚠️ Code 1006 = Backend closed connection abnormally (no close frame)');
      console.warn('💡 Possible causes:');
      console.warn('   1. Backend WebSocket server crashed or not ready');
      console.warn('   2. Backend rejected the connection (auth/validation failed)');
      console.warn('   3. Network issue between client and server');
      console.warn('📝 Chat will work via REST API without real-time updates');
    }

    if (!this.isIntentionalClose) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('❌ Max reconnection attempts reached. WebSocket will not reconnect automatically.');
      console.warn('💡 Chat will continue working via REST API (without real-time updates)');
      // Don't show toast error to avoid annoying users
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectAttempts++;

    console.log(`🔄 Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingInterval = setInterval(() => {
      this.send('ping', {});
    }, 54000); // Every 54 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  public send(type: ClientEvent, payload: any): void {
    const message: WebSocketMessage = { type, payload };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', type);
    } else {
      console.warn('⚠️ WebSocket not connected, queuing message:', type);
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Flushing ${this.messageQueue.length} queued messages...`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Send typing start
   */
  public sendTypingStart(conversationId: string): void {
    this.send('typing.start', { conversationId });
  }

  /**
   * Send typing stop
   */
  public sendTypingStop(conversationId: string): void {
    this.send('typing.stop', { conversationId });
  }

  /**
   * Show browser notification for new message
   */
  private showBrowserNotification(message: ChatMessage): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification('ข้อความใหม่', {
          body: message.content || 'คุณได้รับไฟล์',
          icon: '/icon-192x192.png',
          tag: message.conversationId, // Prevent duplicate notifications
        });
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  }

  /**
   * Disconnect (intentional close)
   */
  public disconnect(): void {
    this.isIntentionalClose = true;
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    console.log('👋 WebSocket disconnected');
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let chatWebSocketInstance: ChatWebSocketClient | null = null;

/**
 * Get ChatWebSocket singleton instance
 */
export function getChatWebSocket(): ChatWebSocketClient {
  if (!chatWebSocketInstance) {
    chatWebSocketInstance = new ChatWebSocketClient();
  }
  return chatWebSocketInstance;
}

/**
 * Disconnect and cleanup ChatWebSocket
 */
export function disconnectChatWebSocket(): void {
  if (chatWebSocketInstance) {
    chatWebSocketInstance.disconnect();
    chatWebSocketInstance = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default getChatWebSocket;
