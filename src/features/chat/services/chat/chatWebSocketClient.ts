/**
 * Chat WebSocket Client
 * Manages WebSocket connection for real-time messaging
 */

import type { WebSocketMessage, ClientEvent } from './types';
import { routeMessage } from './messageRouter';
import {
  MAX_RECONNECT_ATTEMPTS,
  INITIAL_RECONNECT_DELAY,
  PING_INTERVAL,
  CLOSE_CODE_NORMAL,
  getWebSocketUrl,
  getAuthToken,
} from './constants';

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false; // ป้องกัน duplicate connection attempts

  constructor() {
    // Don't auto-connect, wait for explicit connect() call from ChatProvider
    console.log('🔧 ChatWebSocketClient instance created (not connected yet)');
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    const token = getAuthToken();

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
      const wsUrl = `${getWebSocketUrl()}?token=${token}`;
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
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;

    // Start ping interval
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

      // Route to message handler
      routeMessage(data);
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error, 'Raw:', event.data);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event);
    console.error('🔍 Error details:', {
      type: event.type,
      target: event.target,
      readyState: this.ws?.readyState,
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
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectAttempts++;

    console.log(
      `🔄 Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

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
    }, PING_INTERVAL);
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
   * Disconnect (intentional close)
   */
  public disconnect(): void {
    this.isIntentionalClose = true;
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(CLOSE_CODE_NORMAL, 'Client disconnect');
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
