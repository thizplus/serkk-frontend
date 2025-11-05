// ============================================================================
// WebSocket Service
// จัดการ WebSocket connection สำหรับ real-time notifications
// ============================================================================

type MessageType = 'notification' | 'notification_read' | 'notification_read_all';

interface WebSocketMessage {
  type: MessageType;
  data: {
    notification?: unknown;
    notificationId?: string;
    unreadCount: number;
  };
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // Start with 3 seconds

  /**
   * เชื่อมต่อ WebSocket
   */
  connect(token: string) {
    // ป้องกัน double connect
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING || this.isConnecting) {
      console.log('⚠️ WebSocket is connecting...');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      // WebSocket URL with token in query parameter
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
      const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;
      console.log('🔌 Connecting to WebSocket...');

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
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
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          // ส่งให้ทุก handlers
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket connection failed (backend may not be ready)');
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
        });
        this.isConnecting = false;
        this.ws = null;

        // Auto-reconnect with exponential backoff
        // ไม่ reconnect ถ้า:
        // 1. shouldReconnect = false (user logout)
        // 2. code = 1000 (normal closure) หรือ 1001 (going away)
        // 3. เกิน max attempts
        if (
          this.shouldReconnect &&
          token &&
          event.code !== 1000 &&
          event.code !== 1001 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `🔄 Reconnecting in ${this.reconnectDelay / 1000}s... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );

          this.reconnectTimer = setTimeout(() => {
            this.connect(token);
          }, this.reconnectDelay);

          // Exponential backoff: 3s, 6s, 12s, 24s, 48s
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 60000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('⚠️ WebSocket max reconnect attempts reached. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.isConnecting = false;
    }
  }

  /**
   * ตัดการเชื่อมต่อ WebSocket
   */
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.shouldReconnect = false;
    this.isConnecting = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      // เช็คว่า WebSocket พร้อมก่อน close
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.messageHandlers.clear();
  }

  /**
   * Subscribe to WebSocket messages
   */
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
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
const websocketService = new WebSocketService();

export default websocketService;
