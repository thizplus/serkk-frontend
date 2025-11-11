"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout3 Component
 *
 * Layout สำหรับ 3 media items
 * แสดงแบบ 1 large left + 2 stacked right (Instagram style)
 *
 * Layout:
 * ┌───────────┬─────┐
 * │           │  2  │
 * │     1     ├─────┤
 * │           │  3  │
 * └───────────┴─────┘
 */
export function GridLayout3({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div className={cn("grid grid-cols-2", `gap-${MEDIA_DISPLAY.GRID.GAP}`, className)}>
      {/* Large left image (spans 2 rows) */}
      <MediaItem
        media={media[0]}
        index={0}
        className="row-span-2"
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
      />

      {/* Right column: 2 stacked images */}
      <div className={cn("grid grid-rows-2", `gap-${MEDIA_DISPLAY.GRID.GAP}`)}>
        <MediaItem
          media={media[1]}
          index={1}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
        <MediaItem
          media={media[2]}
          index={2}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
