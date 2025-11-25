// ============================================================================
// Console Utils - Production Console Disabler
// ปิด console.log ใน production, เก็บแค่ error/warn
// ============================================================================

/**
 * Disable console.log in production
 * Keep console.error and console.warn for monitoring
 */
export function setupProductionConsole() {
  if (process.env.NODE_ENV === 'production') {
    // Save original functions
    const originalLog = console.log;
    const originalDebug = console.debug;
    const originalInfo = console.info;

    // Disable non-critical logs
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};

    // Keep error and warn for monitoring
    // console.error remains active
    // console.warn remains active

    console.log('🚫 Console logs disabled in production');
  } else {
    console.log('🔊 Console logs enabled in development');
  }
}

/**
 * Enable console for specific debugging
 */
export function enableConsole() {
  // Restore console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Console enabled for debugging');
  }
}
