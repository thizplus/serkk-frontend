// components/common/EmptyState.tsx
// Reusable empty state component
// คอมโพเนนต์แสดงสถานะไม่มีข้อมูล

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { IconName } from '@/shared/config/icons';
import * as Icons from '@/shared/config/icons';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  withCard?: boolean;
  className?: string;
}

/**
 * EmptyState Component
 *
 * แสดงสถานะเมื่อไม่มีข้อมูล พร้อมไอคอน ข้อความ และปุ่มดำเนินการ
 *
 * @param icon - ชื่อไอคอนที่จะแสดง
 * @param title - หัวข้อหลัก
 * @param description - คำอธิบาย
 * @param action - ปุ่มดำเนินการหลัก (optional)
 * @param secondaryAction - ปุ่มดำเนินการรอง (optional)
 * @param withCard - แสดงใน Card หรือไม่ (default: true)
 * @param className - CSS classes เพิ่มเติม
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="Bell"
 *   title="ไม่มีการแจ้งเตือน"
 *   description="เมื่อมีคนโต้ตอบกับคุณ คุณจะเห็นการแจ้งเตือนที่นี่"
 * />
 *
 * <EmptyState
 *   icon="MessageSquare"
 *   title="ไม่มีข้อความ"
 *   description="เริ่มสนทนากับเพื่อนของคุณ"
 *   action={{
 *     label: "เริ่มแชท",
 *     onClick: () => router.push('/chat'),
 *   }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  withCard = true,
  className,
}) => {
  const IconComponent = Icons[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in EmptyState`);
    return null;
  }

  const content = (
    <div className={cn('py-16 text-center', className)}>
      <IconComponent className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />

      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (withCard) {
    return (
      <Card>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

/**
 * Pre-configured Empty States
 * สำหรับกรณีทั่วไป
 */

export const EmptyPosts: React.FC<{
  action?: EmptyStateProps['action'];
}> = ({ action }) => (
  <EmptyState
    icon="FileText"
    title="ไม่มีโพสต์"
    description="ยังไม่มีโพสต์ในส่วนนี้"
    action={action}
  />
);

export const EmptyComments: React.FC = () => (
  <EmptyState
    icon="MessageSquare"
    title="ยังไม่มีความคิดเห็น"
    description="เป็นคนแรกที่แสดงความคิดเห็น!"
    withCard={false}
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon="Bell"
    title="ไม่มีการแจ้งเตือน"
    description="เมื่อมีคนโต้ตอบกับคุณ คุณจะเห็นการแจ้งเตือนที่นี่"
  />
);

export const EmptyMessages: React.FC<{
  action?: EmptyStateProps['action'];
}> = ({ action }) => (
  <EmptyState
    icon="MessageCircle"
    title="ไม่มีข้อความ"
    description="เริ่มสนทนากับเพื่อนของคุณ"
    action={action}
  />
);

export const EmptyBookmarks: React.FC = () => (
  <EmptyState
    icon="Bookmark"
    title="ไม่มีโพสต์ที่บันทึก"
    description="โพสต์ที่คุณบันทึกไว้จะปรากฏที่นี่"
  />
);

export const EmptySearchResults: React.FC = () => (
  <EmptyState
    icon="Search"
    title="ไม่พบผลลัพธ์"
    description="ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง"
    withCard={false}
  />
);

export const EmptyFollowers: React.FC = () => (
  <EmptyState
    icon="Users"
    title="ยังไม่มีผู้ติดตาม"
    description="เมื่อมีคนติดตามคุณ พวกเขาจะปรากฏที่นี่"
  />
);
