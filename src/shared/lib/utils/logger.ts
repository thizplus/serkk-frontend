/**
 * Development Logger Utility
 *
 * เปิด/ปิดการแสดง log ได้ตามต้องการ
 * แสดงแค่ตอน development และต้อง enable ด้วย localStorage
 */

// ตรวจสอบว่าอยู่ใน development mode หรือไม่
const isDev = process.env.NODE_ENV === 'development';

// ตรวจสอบว่า debug mode เปิดอยู่หรือไม่ (จาก localStorage)
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('DEBUG_MODE') === 'true';
};

/**
 * Debug Categories
 * เปิด/ปิด log ตาม category
 */
export const DEBUG_CATEGORIES = {
  UPLOAD: 'upload',
  RENDER: 'render',
  API: 'api',
  STATE: 'state',
  PERFORMANCE: 'performance',
} as const;

type DebugCategory = (typeof DEBUG_CATEGORIES)[keyof typeof DEBUG_CATEGORIES];

/**
 * Check if specific category is enabled
 */
const isCategoryEnabled = (category: DebugCategory): boolean => {
  if (typeof window === 'undefined') return false;
  const enabledCategories = localStorage.getItem('DEBUG_CATEGORIES');
  if (!enabledCategories) return true; // ถ้าไม่ได้ตั้งค่า แสดงทุก category
  return enabledCategories.split(',').includes(category);
};

/**
 * Custom Logger
 */
export const logger = {
  /**
   * Debug log (แสดงแค่ตอน development + debug mode เปิด)
   */
  debug: (category: DebugCategory, message: string, ...args: any[]) => {
    if (isDev && isDebugEnabled() && isCategoryEnabled(category)) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`[${timestamp}] [${category.toUpperCase()}]`, message, ...args);
    }
  },

  /**
   * Info log (แสดงเสมอใน development)
   */
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log('ℹ️', message, ...args);
    }
  },

  /**
   * Warning log (แสดงทั้ง dev และ production)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn('⚠️', message, ...args);
  },

  /**
   * Error log (แสดงทั้ง dev และ production)
   */
  error: (message: string, ...args: any[]) => {
    console.error('❌', message, ...args);
  },

  /**
   * Performance measurement
   */
  time: (label: string) => {
    if (isDev && isDebugEnabled()) {
      console.time(`⏱️ ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (isDev && isDebugEnabled()) {
      console.timeEnd(`⏱️ ${label}`);
    }
  },

  /**
   * Group logs (useful for component lifecycle)
   */
  group: (label: string) => {
    if (isDev && isDebugEnabled()) {
      console.group(`📦 ${label}`);
    }
  },

  groupEnd: () => {
    if (isDev && isDebugEnabled()) {
      console.groupEnd();
    }
  },
};

/**
 * React Component Render Tracker
 * ติดตามว่า component render กี่ครั้ง
 */
export const useRenderTracker = (componentName: string) => {
  if (!isDev || !isDebugEnabled()) return;

  const renderCountRef = { current: 0 };

  renderCountRef.current += 1;
  logger.debug(
    DEBUG_CATEGORIES.RENDER,
    `${componentName} rendered`,
    `Count: ${renderCountRef.current}`
  );
};

/**
 * Helper: Enable/Disable debug mode
 */
export const debugMode = {
  enable: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('DEBUG_MODE', 'true');
      console.log('✅ Debug mode enabled. Reload page to see logs.');
    }
  },

  disable: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('DEBUG_MODE');
      console.log('❌ Debug mode disabled.');
    }
  },

  /**
   * Enable specific categories only
   * Example: debugMode.setCategories(['upload', 'api'])
   */
  setCategories: (categories: DebugCategory[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('DEBUG_CATEGORIES', categories.join(','));
      console.log('✅ Debug categories set:', categories);
    }
  },

  status: () => {
    if (typeof window !== 'undefined') {
      const enabled = localStorage.getItem('DEBUG_MODE') === 'true';
      const categories = localStorage.getItem('DEBUG_CATEGORIES');
      console.log('Debug Mode:', enabled ? '✅ Enabled' : '❌ Disabled');
      console.log('Categories:', categories || 'All');
    }
  },
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugMode = debugMode;
}
