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

// Types (re-export shared types for convenience)
export type {
  Notification,
  NotificationSettings
} from '@/types';
