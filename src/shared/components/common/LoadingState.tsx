// components/common/LoadingState.tsx
// Reusable loading state component
// คอมโพเนนต์แสดงสถานะกำลังโหลด

import { cn } from '@/lib/utils';
import { Loader2 } from '@/config/icons';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

/**
 * LoadingState Component
 *
 * แสดงสถานะกำลังโหลดพร้อมข้อความและไอคอน
 *
 * @param message - ข้อความที่จะแสดง (default: "กำลังโหลด...")
 * @param size - ขนาดของ spinner (sm, md, lg)
 * @param fullPage - แสดงเต็มหน้าจอหรือไม่
 * @param className - CSS classes เพิ่มเติม
 *
 * @example
 * ```tsx
 * <LoadingState message="กำลังโหลดโปรไฟล์..." />
 * <LoadingState size="lg" fullPage />
 * <LoadingState size="sm" message="กำลังบันทึก..." />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'กำลังโหลด...',
  size = 'md',
  fullPage = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'text-center py-16';

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className={cn(
            sizeClasses[size],
            'animate-spin text-primary'
          )}
        />
        {message && (
          <p className="text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Inline Loading Spinner
 * Smaller spinner for inline use
 */
export const InlineLoader: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
);

/**
 * Button Loading Spinner
 * Tiny spinner for use in buttons
 */
export const ButtonLoader: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn('h-4 w-4 animate-spin mr-2', className)} />
);
