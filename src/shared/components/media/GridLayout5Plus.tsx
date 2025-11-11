"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout5Plus Component
 *
 * Layout สำหรับ 5+ media items
 * แสดงแบบ Instagram-style mixed layout
 * - แสดงสูงสุด 5 items
 * - Item สุดท้ายจะแสดง "+N" overlay ถ้ามีเกิน 5 items
 *
 * Layout (5 items):
 * ┌───────────────┬─────┐
 * │               │  2  │
 * │       1       ├─────┤
 * │               │  3  │
 * ├───────┬───────┼─────┤
 * │   4   │   5   │     │
 * └───────┴───────┴─────┘
 */
export function GridLayout5Plus({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  const displayMedia = media.slice(0, MEDIA_DISPLAY.GRID.PREVIEW_MAX_DISPLAY);
  const remainingCount = Math.max(0, media.length - MEDIA_DISPLAY.GRID.PREVIEW_MAX_DISPLAY);

  return (
    <div className={cn("grid grid-cols-3", `gap-${MEDIA_DISPLAY.GRID.GAP}`, className)}>
      {/* Large top-left (spans 2 rows, 2 cols) */}
      <div className="col-span-2 row-span-2">
        <MediaItem
          media={displayMedia[0]}
          index={0}
          editable={editable}
          onClick={onMediaClick}
          onRemove={onRemove}
        />
      </div>

      {/* Right top */}
      <MediaItem
        media={displayMedia[1]}
        index={1}
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
      />

      {/* Right middle */}
      <MediaItem
        media={displayMedia[2]}
        index={2}
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
      />

      {/* Bottom left */}
      <MediaItem
        media={displayMedia[3]}
        index={3}
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
      />

      {/* Bottom right (with +N overlay if more items) */}
      <MediaItem
        media={displayMedia[4]}
        index={4}
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
        showOverlay={remainingCount > 0}
        remainingCount={remainingCount}
      />
    </div>
  );
}
