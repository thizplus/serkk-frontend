// components/common/ErrorState.tsx
// Reusable error state component
// คอมโพเนนต์แสดงสถานะข้อผิดพลาด

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from '@/shared/config/icons';
import type { IconName } from '@/shared/config/icons';
import * as Icons from '@/shared/config/icons';

interface ErrorStateProps {
  title?: string;
  message?: string | Error;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: IconName;
  fullPage?: boolean;
  className?: string;
}

/**
 * ErrorState Component
 *
 * แสดงสถานะข้อผิดพลาดพร้อมข้อความและปุ่มดำเนินการ
 *
 * @param title - หัวข้อข้อผิดพลาด (default: "เกิดข้อผิดพลาด")
 * @param message - ข้อความอธิบาย (รองรับ string หรือ Error object)
 * @param actionLabel - ข้อความปุ่มหลัก (default: "ลองอีกครั้ง")
 * @param onAction - ฟังก์ชันเมื่อกดปุ่มหลัก
 * @param secondaryActionLabel - ข้อความปุ่มรอง
 * @param onSecondaryAction - ฟังก์ชันเมื่อกดปุ่มรอง
 * @param icon - ชื่อไอคอน (default: "AlertCircle")
 * @param fullPage - แสดงเต็มหน้าจอหรือไม่
 * @param className - CSS classes เพิ่มเติม
 *
 * @example
 * ```tsx
 * <ErrorState
 *   message={error}
 *   onAction={() => refetch()}
 * />
 *
 * <ErrorState
 *   title="ไม่พบโพสต์"
 *   message="โพสต์นี้อาจถูกลบไปแล้ว"
 *   actionLabel="กลับหน้าหลัก"
 *   onAction={() => router.push('/')}
 *   icon="XCircle"
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'เกิดข้อผิดพลาด',
  message,
  actionLabel = 'ลองอีกครั้ง',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon = 'AlertCircle',
  fullPage = false,
  className,
}) => {
  const errorMessage = message instanceof Error
    ? message.message
    : message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';

  const IconComponent = Icons[icon] || AlertCircle;

  const containerClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'text-center py-16';

  return (
    <div className={cn(containerClass, className)}>
      <div className="max-w-md mx-auto px-4">
        <IconComponent className="mx-auto h-16 w-16 text-destructive mb-4" />

        <h2 className="text-2xl font-bold mb-2 text-foreground">
          {title}
        </h2>

        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onAction && (
            <Button onClick={onAction} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <Button
              onClick={onSecondaryAction}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Error Message
 * Smaller error display for inline use
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message,
  className,
}) => (
  <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
    <AlertCircle className="h-4 w-4 shrink-0" />
    <span>{message}</span>
  </div>
);
