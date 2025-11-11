/**
 * Browser Notification Handler
 * Handles showing browser notifications for new messages
 */

import type { ChatMessage } from '@/types/models';

/**
 * Show browser notification for new message
 */
export function showBrowserNotification(message: ChatMessage): void {
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
