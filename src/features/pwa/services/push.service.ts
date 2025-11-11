/**
 * Push Notification Service
 * - Uses apiService for automatic auth token injection
 * - Handles push subscription/unsubscription
 */

import apiService from '@/lib/api/http-client';

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPublicKeyResponse {
  publicKey: string;
}

export interface PushSubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    userId: string;
    endpoint: string;
  };
}

/**
 * Push Notification Service
 */
export const pushService = {
  /**
   * Get VAPID public key from backend
   */
  getPublicKey: async (): Promise<string> => {
    const response = await apiService.get<PushPublicKeyResponse>('/push/public-key');
    return response.publicKey;
  },

  /**
   * Subscribe to push notifications
   */
  subscribe: async (subscription: PushSubscription): Promise<PushSubscribeResponse> => {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || '',
      },
    };

    return await apiService.post<PushSubscribeResponse>('/push/subscribe', subscriptionData);
  },

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: async (subscription: PushSubscription): Promise<PushSubscribeResponse> => {
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: subscription.toJSON().keys?.p256dh || '',
        auth: subscription.toJSON().keys?.auth || '',
      },
    };

    return await apiService.post<PushSubscribeResponse>('/push/unsubscribe', subscriptionData);
  },
};
