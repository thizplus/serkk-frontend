"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout4 Component
 *
 * Layout สำหรับ 4 media items
 * แสดงแบบ 2x2 grid
 *
 * Layout:
 * ┌─────────┬─────────┐
 * │    1    │    2    │
 * ├─────────┼─────────┤
 * │    3    │    4    │
 * └─────────┴─────────┘
 *
 * ✅ Expert Recommendation: Fixed height (320px) for virtual scroll stability
 */
export function GridLayout4({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden",
        `gap-${MEDIA_DISPLAY.GRID.GAP_COMPACT}`,
        className
      )}
      style={{ height: `${MEDIA_DISPLAY.GRID.HEIGHT_FIXED}px` }}
    >
      {media.slice(0, 4).map((item, index) => (
        <MediaItem
          key={item.id}
          media={item}
          index={index}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
