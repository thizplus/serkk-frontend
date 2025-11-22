"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout2 Component
 *
 * Layout สำหรับ 2 media items
 * แสดงแบบ 2 columns side-by-side
 *
 * Layout:
 * ┌─────────┬─────────┐
 * │    1    │    2    │
 * │   1:1   │   1:1   │
 * └─────────┴─────────┘
 *
 * ✅ ใช้ aspect-square (1:1) สำหรับ responsive design
 */
export function GridLayout2({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-1",
        className
      )}
    >
      {media.slice(0, 2).map((item, index) => (
        <div
          key={item.id}
          className={cn(
            MEDIA_DISPLAY.ASPECT_RATIO.GRID_ITEM,  // aspect-square (1:1)
            "overflow-hidden rounded-lg bg-muted"
          )}
        >
          <MediaItem
            media={item}
            index={index}
            editable={editable}
            onClick={onMediaClick}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  );
}
