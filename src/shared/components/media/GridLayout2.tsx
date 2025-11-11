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
 * └─────────┴─────────┘
 */
export function GridLayout2({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div className={cn("grid grid-cols-2", `gap-${MEDIA_DISPLAY.GRID.GAP}`, className)}>
      {media.slice(0, 2).map((item, index) => (
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
