"use client";

// ============================================================================
// Optimistic Post Card (Phase 1 & 2)
// แสดง temp post แบบ compact (ไม่แสดงรูป/วิดีโอ)
// ============================================================================
//
// ใช้สำหรับแสดง temp post ใน feed (simple progress indicator)
// เมื่อ upload เสร็จจะถูกแทนที่ด้วย post จริงจาก backend
//
// Phase 2: เพิ่ม Retry button เมื่อ upload failed
//
// ============================================================================

import { useOptimisticPostStore } from '@/features/posts/stores/optimisticPostStore';
import { useOptimisticPost } from '@/features/posts/hooks/useOptimisticPost';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/shared/components/ui/item';
import { Spinner } from '@/shared/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface OptimisticPostCardProps {
  tempId: string;
}

/**
 * Optimistic Post Card
 *
 * แสดง temp post แบบ compact พร้อม upload indicator
 * Phase 2: เพิ่ม Retry button เมื่อ failed
 */
export function OptimisticPostCard({ tempId }: OptimisticPostCardProps) {
  const getOptimisticPost = useOptimisticPostStore((state) => state.getOptimisticPost);
  const { retryPost } = useOptimisticPost();
  const optimisticPost = getOptimisticPost(tempId);

  if (!optimisticPost) {
    return null; // Post removed from store
  }

  // Determine status
  const isUploading = optimisticPost.status === 'uploading' ||
                       optimisticPost.status === 'creating_post';
  const isCompleted = optimisticPost.status === 'completed';
  const isFailed = optimisticPost.status === 'failed';

  // Check if files are not found (cannot retry)
  const isFilesNotFound = isFailed && optimisticPost.error?.startsWith('FILES_NOT_FOUND:');

  // Status text
  const statusText = isFailed
    ? 'อัปโหลดล้มเหลว'
    : isCompleted
    ? 'โพสต์สำเร็จ'
    : 'กำลังอัปโหลด...';

  // Handle retry
  const handleRetry = async () => {
    await retryPost(tempId);
  };

  return (
    <div className="space-y-2">
      <Item variant="muted" className="flex items-center justify-between pr-4">
        {/* Left side: Icon + Content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ItemMedia>
            {isFailed ? (
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <Spinner className="flex-shrink-0" />
            )}
          </ItemMedia>
          <ItemContent className="flex-1 min-w-0">
            <ItemTitle className="line-clamp-1">{optimisticPost.title}</ItemTitle>
            <p className={`text-sm ${
              isFailed
                ? 'text-destructive'
                : isCompleted
                ? 'text-green-600'
                : 'text-muted-foreground'
            }`}>
              {statusText}
            </p>
            {/* ✅ Phase 2: แสดง error message ถ้ามี */}
            {isFailed && optimisticPost.error && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {/* Remove "FILES_NOT_FOUND:" prefix for display */}
                {optimisticPost.error.replace('FILES_NOT_FOUND: ', '')}
              </p>
            )}
          </ItemContent>
        </div>

        {/* Right side: Retry Button (hide if files not found) */}
        {isFailed && !isFilesNotFound && (
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="flex-shrink-0 ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">ลองใหม่</span>
            <span className="sm:hidden">Retry</span>
          </Button>
        )}
      </Item>

      {/* ✅ Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="px-4">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            🔍 Debug Info
          </summary>
          <div className="mt-1 p-2 bg-muted rounded text-xs font-mono space-y-1">
            <div>status: {optimisticPost.status}</div>
            <div>tempId: {optimisticPost.tempId.slice(0, 20)}...</div>
            {optimisticPost.error && (
              <div className="text-destructive">error: {optimisticPost.error}</div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
