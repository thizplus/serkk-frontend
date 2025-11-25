// Notifications Feature Barrel Export

// Hooks
export {
  useNotifications,
  useInfiniteNotifications,
  useInfiniteUnreadNotifications,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useUnreadNotificationCount,
  useMarkAllAsRead,
  useMarkAsRead,
  useDeleteNotification,
  notificationKeys
} from './hooks/useNotifications';

export { useNotificationWebSocket } from './hooks/useNotificationWebSocket';

// Types (re-export shared types for convenience)
export type {
  Notification,
  NotificationSettings
} from '@/types';
