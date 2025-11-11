// Notifications Feature Barrel Export

// Hooks
export {
  useNotifications,
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
} from '@/shared/types';
