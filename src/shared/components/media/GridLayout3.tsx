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
 * ┌─────────┬───┐
 * │         │ 2 │
 * │    1    │1:1│
 * │   1:1   ├───┤
 * │         │ 3 │
 * └─────────┴───┘
 *
 * ✅ ใช้ aspect-square (1:1) สำหรับ responsive design
 */
export function GridLayout3({
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
      {/* Large left image (row-span-2) */}
      <div
        className={cn(
          "row-span-2",
          MEDIA_DISPLAY.ASPECT_RATIO.GRID_ITEM,  // aspect-square (1:1)
          "overflow-hidden rounded-lg bg-muted"
        )}
      >
        <MediaItem
          media={media[0]}
          index={0}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      </div>

      {/* Right column: 2 stacked images */}
      <div className="grid grid-rows-2 gap-1">
        <div
          className={cn(
            MEDIA_DISPLAY.ASPECT_RATIO.GRID_ITEM,  // aspect-square (1:1)
            "overflow-hidden rounded-lg bg-muted"
          )}
        >
          <MediaItem
            media={media[1]}
            index={1}
            editable={editable}
            onClick={onMediaClick}
            onRemove={onRemove}
          />
        </div>
        <div
          className={cn(
            MEDIA_DISPLAY.ASPECT_RATIO.GRID_ITEM,  // aspect-square (1:1)
            "overflow-hidden rounded-lg bg-muted"
          )}
        >
          <MediaItem
            media={media[2]}
            index={2}
            editable={editable}
            onClick={onMediaClick}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  );
}
