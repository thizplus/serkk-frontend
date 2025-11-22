"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout6 Component
 *
 * Layout สำหรับ 6 media items
 * แสดงแบบ 2x3 grid (2 rows, 3 columns)
 *
 * Layout:
 * ┌─────┬─────┬─────┐
 * │  1  │  2  │  3  │
 * │ 1:1 │ 1:1 │ 1:1 │
 * ├─────┼─────┼─────┤
 * │  4  │  5  │  6  │
 * │ 1:1 │ 1:1 │ 1:1 │
 * └─────┴─────┴─────┘
 *
 * ✅ ใช้ aspect-square (1:1) สำหรับ responsive design
 */
export function GridLayout6({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-1",
        className
      )}
    >
      {media.slice(0, 6).map((item, index) => (
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
