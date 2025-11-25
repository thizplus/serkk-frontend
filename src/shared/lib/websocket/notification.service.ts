// ============================================================================
// Notification WebSocket Service
// จัดการ WebSocket connection สำหรับ notifications, video encoding, post.published
// ============================================================================

type NotificationMessageType =
  | 'connection.success'
  // Notification events (from backend)
  | 'notification:new'
  | 'notification:read'
  | 'notification:read_all'
  | 'notification:count_updated'
  // Post events (from backend)
  | 'post:new'
  | 'post:updated'
  | 'post:deleted'
  | 'post:auto_published'  // Colon notation
  | 'post.auto_published'  // Dot notation (backend may use this)
  | 'post.published'  // Legacy
  // Vote events (from backend)
  | 'vote:updated'
  // Video encoding events (global)
  | 'video:encoding:updated'
  | 'video:encoding:completed'
  | 'video:encoding:failed'
  // Legacy support (will be deprecated)
  | 'video.encoding.progress'
  | 'video.encoding.completed'
  | 'video.encoding.failed'
  // Message/Chat video events
  | 'message:video:updated'
  | 'message:video:completed'
  | 'error';

interface NotificationMessage {
  type: NotificationMessageType;
  payload?: any;
  error?: {
    code: string;
    message: string;
  };
}

type EventHandler = (data: any) => void;

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<NotificationMessageType, Set<EventHandler>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // Start with 3 seconds

  /**
   * เชื่อมต่อ Notification WebSocket
   */
  connect(token: string) {
    // ป้องกัน double connect
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Notification WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING || this.isConnecting) {
      console.log('⚠️ Notification WebSocket is connecting...');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      // WebSocket URL สำหรับ notifications
      const baseUrl = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL || 'ws://localhost:8080/ws/notifications';
      const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;
      console.log('🔔 Connecting to Notification WebSocket...');

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Notification WebSocket connected');
        this.isConnecting = false;

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        this.reconnectDelay = 3000;

        // Clear reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          console.log('📬 Notification message:', message);

          // Handle errors
          if (message.type === 'error') {
            console.error('❌ Notification WebSocket error:', message.error);
            return;
          }

          // Trigger event-specific listeners
          const listeners = this.eventListeners.get(message.type);
          if (listeners) {
            listeners.forEach((handler) => handler(message.payload));
          }
        } catch (error) {
          console.error('❌ Failed to parse Notification WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ Notification WebSocket connection failed (backend may not be ready)');
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 Notification WebSocket disconnected', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
        });
        this.isConnecting = false;
        this.ws = null;

        // Auto-reconnect with exponential backoff
        if (
          this.shouldReconnect &&
          token &&
          event.code !== 1000 &&
          event.code !== 1001 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `🔄 Reconnecting to notifications in ${this.reconnectDelay / 1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );

          this.reconnectTimer = setTimeout(() => {
            this.connect(token);
          }, this.reconnectDelay);

          // Exponential backoff: 3s, 6s, 12s, 24s, 48s
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('⚠️ Notification WebSocket max reconnect attempts reached. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create Notification WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * ตัดการเชื่อมต่อ WebSocket
   */
  disconnect() {
    console.log('🔌 Disconnecting Notification WebSocket...');
    this.shouldReconnect = false;
    this.isConnecting = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.eventListeners.clear();
  }

  /**
   * Subscribe to specific event type
   *
   * @param eventType - Event type to listen to
   * @param handler - Callback function
   * @returns Unsubscribe function
   *
   * @example
   * const unsubscribe = notificationService.on('video.encoding.completed', (data) => {
   *   console.log('Video ready:', data.mediaId);
   * });
   *
   * // Later: cleanup
   * unsubscribe();
   */
  on(eventType: NotificationMessageType, handler: EventHandler): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(handler);

        // Cleanup empty sets
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
    };
  }

  /**
   * ตรวจสอบสถานะ connection
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
const notificationService = new NotificationWebSocketService();

export default notificationService;
