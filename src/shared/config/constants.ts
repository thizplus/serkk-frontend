// lib/config/constants.ts
// Centralized constants for the SUEKK application
// ค่าคงที่ทั้งหมดของระบบ SUEKK

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MESSAGE_LIMIT: 50,
  COMMENT_LIMIT: 20,
  LARGE_LIMIT: 100,
  INFINITE_SCROLL_THRESHOLD: 0.8, // 80% scrolled
} as const;

// Form Limits
export const FORM_LIMITS = {
  POST: {
    TITLE_MIN: 1,
    TITLE_MAX: 300,
    CONTENT_MIN: 1,
    CONTENT_MAX: 10000,
    TAGS_MAX: 5,
  },
  COMMENT: {
    CONTENT_MIN: 1,
    CONTENT_MAX: 2000,
  },
  USER: {
    USERNAME_MIN: 3,
    USERNAME_MAX: 30,
    DISPLAY_NAME_MAX: 50,
    BIO_MAX: 200,
    PASSWORD_MIN: 8,
  },
  CHAT: {
    MESSAGE_MAX: 2000,
  },
  MEDIA: {
    MAX_FILES: 200, // Maximum files per post
    MAX_SIZE_MB: 100, // 100 MB per file
    MAX_SIZE_BYTES: 100 * 1024 * 1024,
    CONCURRENT_UPLOADS: 5, // Upload 5 files at a time
    PREVIEW_MAX_DISPLAY: 5, // Show 5 files in grid (Facebook-style)
  },
} as const;

// WebSocket Configuration
export const WEBSOCKET = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 1000,
  MAX_RECONNECT_DELAY_MS: 60000,
  RECONNECT_MULTIPLIER: 2,
  PING_INTERVAL_MS: 54000,
  PING_TIMEOUT_MS: 5000,
  MESSAGE_QUEUE_SIZE: 100,
} as const;

// UI Configuration
export const UI = {
  TOAST_DURATION: 3000,
  TOOLTIP_DELAY: 200,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  SIDEBAR: {
    WIDTH: '16rem',
    WIDTH_MOBILE: '18rem',
    WIDTH_ICON: '3rem',
    COOKIE_NAME: 'sidebar_state',
    COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  },
} as const;

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_CHAT: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_VIDEO_UPLOAD: true,
  ENABLE_SEARCH: true,
  ENABLE_TAGS: true,
} as const;

// Media Display Configuration
export const MEDIA_DISPLAY = {
  // Max heights for different display modes
  MAX_HEIGHT: {
    FEED: 800, // pixels - for feed mode (เพิ่มจาก 600px)
    DETAIL: 1200, // pixels - for detail mode (เพิ่มจาก 800px)
  },
  // Grid settings
  GRID: {
    GAP: 2, // Tailwind gap-2
    PREVIEW_MAX_DISPLAY: 5, // Show max 5 items in grid
  },
  // Lightbox settings
  LIGHTBOX: {
    MAX_ZOOM: 3, // 3x zoom for images
    ANIMATION_DURATION: 250, // ms
    ENABLE_INFINITE_LOOP: false,
  },
  // Video player settings
  VIDEO: {
    PRELOAD: 'metadata' as const, // 'none' | 'metadata' | 'auto'
    CONTROLS: true,
    MUTED_IN_GRID: true, // Mute videos in grid preview
    AUTO_PLAY: false,
  },
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: (username: string) => `/profile/${username}`,
  PROFILE_EDIT: '/profile/edit',
  POST: (id: string) => `/post/${id}`,
  CREATE_POST: '/create-post',
  SEARCH: '/search',
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
  SAVED: '/saved',
  SETTINGS: '/settings',
} as const;
