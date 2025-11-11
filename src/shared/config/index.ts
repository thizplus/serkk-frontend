// lib/config/index.ts
// Central export for all configuration files
// ส่งออกการตั้งค่าทั้งหมด

// Constants
export {
  PAGINATION,
  FORM_LIMITS,
  WEBSOCKET,
  UI,
  TIME,
  FEATURES,
  ROUTES,
} from './constants';

// Toast Messages
export { TOAST_MESSAGES, showToast } from './toastMessages';

// Loading Messages
export { LOADING_MESSAGES } from './loadingMessages';

// Icons
export * from './icons';
export type { IconName } from './icons';

// Icon Mappings
export {
  NOTIFICATION_ICONS,
  POST_ACTION_ICONS,
  COMMENT_ACTION_ICONS,
  CHAT_ACTION_ICONS,
  MEDIA_TYPE_ICONS,
  USER_ACTION_ICONS,
  STATUS_ICONS,
  SORT_FILTER_ICONS,
  EMPTY_STATE_ICONS,
} from './iconMappings';

// Validation
export {
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  validators,
  ALLOWED_FILE_TYPES,
  isAllowedFileType,
} from './validation';
