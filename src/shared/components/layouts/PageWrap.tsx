import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageWrapProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageWrap Component
 *
 * Wrapper สำหรับ content ที่ไม่ใช่ PostCard
 * เพิ่ม padding ใน mobile (p-4) แต่ไม่มี padding ใน desktop (md:p-0)
 *
 * Use Cases:
 * - Buttons, Forms, Text content
 * - ทุกอย่างที่ไม่ใช่ PostCard (ซึ่งควร edge-to-edge)
 *
 * @example
 * <PageWrap>
 *   <Button>กลับ</Button>
 * </PageWrap>
 */
export function PageWrap({ children, className }: PageWrapProps) {
  return (
    <div className={cn("p-4 md:px-0", className)}>
      {children}
    </div>
  );
}
