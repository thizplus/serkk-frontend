"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout5 Component
 *
 * Layout สำหรับ 5 media items เท่านั้น
 * แสดงแบบ Instagram-style mixed layout
 *
 * Layout:
 * ┌─────────────┬───┐
 * │             │ 2 │
 * │      1      ├───┤
 * │    1:1      │ 3 │
 * ├─────┬───────┴───┤
 * │  4  │     5     │
 * └─────┴───────────┘
 *
 * ✅ ใช้ aspect-square สำหรับ responsive design
 */
export function GridLayout5({
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
      {/* Large top-left (col-span-2, row-span-2) */}
      <div
        className={cn(
          "col-span-2 row-span-2",
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

      {/* Right top */}
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

      {/* Right middle */}
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

      {/* Bottom left */}
      <div
        className={cn(
          MEDIA_DISPLAY.ASPECT_RATIO.GRID_ITEM,  // aspect-square (1:1)
          "overflow-hidden rounded-lg bg-muted"
        )}
      >
        <MediaItem
          media={media[3]}
          index={3}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      </div>

      {/* Bottom right (col-span-2) */}
      <div
        className={cn(
          "col-span-2",
          "aspect-[2/1]",  // 2:1 ratio (wider)
          "overflow-hidden rounded-lg bg-muted"
        )}
      >
        <MediaItem
          media={media[4]}
          index={4}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
