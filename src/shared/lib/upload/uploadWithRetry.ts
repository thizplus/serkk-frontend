// ============================================================================
// Upload with Retry (Phase 2: Auto-Retry Mechanism)
// ============================================================================
//
// Purpose:
// - Retry failed uploads automatically
// - Exponential backoff with jitter
// - Configurable max retries and delay
// - Smart retry logic (only retry on network errors, not client errors)
//
// Usage:
// - Wrap upload functions with uploadWithRetry
// - Automatically retries on network errors
// - Fails fast on client errors (4xx)
//
// ============================================================================

// ============================================================================
// Types
// ============================================================================

export interface RetryOptions {
  /**
   * Maximum number of retries (default: 3)
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds (default: 1000ms = 1 second)
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds (default: 30000ms = 30 seconds)
   */
  maxDelay?: number;

  /**
   * Jitter factor (0-1, default: 0.3 = 30%)
   * Adds randomness to delay to prevent thundering herd
   */
  jitterFactor?: number;

  /**
   * Custom function to determine if error is retryable
   * Default: retry on network errors and 5xx errors
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Callback on retry attempt
   */
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
}

// ============================================================================
// Default Retry Logic
// ============================================================================

/**
 * Default function to determine if error should be retried
 *
 * Retryable errors:
 * - Network errors (fetch failed, timeout, etc.)
 * - 5xx server errors (500, 502, 503, 504)
 * - Rate limiting (429)
 *
 * Non-retryable errors:
 * - 4xx client errors (400, 401, 403, 404, etc.)
 * - Upload cancelled by user
 */
function defaultShouldRetry(error: Error, attempt: number): boolean {
  const errorMessage = error.message.toLowerCase();

  // ============================================================================
  // Retryable Errors
  // ============================================================================

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('socket')
  ) {
    return true;
  }

  // 5xx server errors
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('server error')
  ) {
    return true;
  }

  // Rate limiting
  if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
    return true;
  }

  // ============================================================================
  // Non-retryable Errors
  // ============================================================================

  // 4xx client errors (except 429)
  if (
    errorMessage.includes('400') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('404') ||
    errorMessage.includes('client error') ||
    errorMessage.includes('bad request') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('not found')
  ) {
    return false;
  }

  // User cancelled
  if (errorMessage.includes('cancel') || errorMessage.includes('abort')) {
    return false;
  }

  // Default: retry for unknown errors (conservative approach)
  return true;
}

// ============================================================================
// Upload with Retry Function
// ============================================================================

/**
 * Retry an async upload function with exponential backoff
 *
 * Features:
 * - Exponential backoff (delay doubles on each retry)
 * - Jitter (randomness to prevent thundering herd)
 * - Max delay cap (prevent infinite delays)
 * - Smart retry logic (only retry on network errors)
 *
 * @param uploadFn - Async function to retry
 * @param options - Retry options
 * @returns Promise that resolves to the upload result
 *
 * @example
 * ```ts
 * const result = await uploadWithRetry(
 *   () => uploadFile(file),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt}/3 after ${delay}ms: ${error.message}`);
 *     },
 *   }
 * );
 * ```
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitterFactor = 0.3,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  // Try upload with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt upload
      const result = await uploadFn();

      // Success! Return result
      if (attempt > 0) {
        console.log(`✅ Upload succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // ============================================================================
      // Check if should retry
      // ============================================================================

      // Don't retry if not a retryable error
      if (!shouldRetry(lastError, attempt)) {
        console.log(`❌ Upload failed with non-retryable error:`, lastError.message);
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        console.log(`❌ Upload failed after ${maxRetries} ${maxRetries === 1 ? 'retry' : 'retries'}`);
        throw lastError;
      }

      // ============================================================================
      // Calculate delay with exponential backoff + jitter
      // ============================================================================

      // Exponential backoff: delay = baseDelay * (2 ^ attempt)
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      // Add jitter: random value between 0% and jitterFactor% of delay
      const jitter = Math.random() * jitterFactor * exponentialDelay;
      const delay = Math.round(exponentialDelay + jitter);

      console.log(
        `⚠️ Upload failed (attempt ${attempt + 1}/${maxRetries + 1}): ${lastError.message}\n` +
        `   Retrying in ${delay}ms...`
      );

      // Callback
      onRetry?.(lastError, attempt + 1, delay);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here (loop always throws on last attempt)
  throw lastError!;
}

// ============================================================================
// Batch Upload with Retry
// ============================================================================

/**
 * Upload multiple files with retry for each file
 *
 * Features:
 * - Retry each file independently
 * - Continue uploading even if some files fail
 * - Return results for all files (success + failed)
 *
 * @param uploadFns - Array of upload functions (one per file)
 * @param options - Retry options (applied to all files)
 * @returns Promise with results for all files
 *
 * @example
 * ```ts
 * const results = await batchUploadWithRetry(
 *   files.map(file => () => uploadFile(file)),
 *   { maxRetries: 3 }
 * );
 *
 * const successCount = results.filter(r => r.status === 'success').length;
 * const failedCount = results.filter(r => r.status === 'failed').length;
 * ```
 */
export async function batchUploadWithRetry<T>(
  uploadFns: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<Array<{ status: 'success' | 'failed'; result?: T; error?: Error }>> {
  const results = await Promise.all(
    uploadFns.map(async (uploadFn, index) => {
      try {
        const result = await uploadWithRetry(uploadFn, {
          ...options,
          onRetry: (error, attempt, delay) => {
            console.log(`📁 File ${index + 1}: Retry ${attempt} after ${delay}ms`);
            options.onRetry?.(error, attempt, delay);
          },
        });

        return { status: 'success' as const, result };
      } catch (error) {
        console.error(`❌ File ${index + 1} failed after retries:`, error);
        return { status: 'failed' as const, error: error as Error };
      }
    })
  );

  return results;
}
