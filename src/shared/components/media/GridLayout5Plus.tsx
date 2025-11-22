"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaItem } from "./MediaItem";
import type { GridLayoutProps } from "./types";

/**
 * GridLayout5Plus Component
 *
 * Layout สำหรับ 7+ media items
 * แสดงแบบ 2x3 grid (เหมือน GridLayout6)
 * - แสดงสูงสุด 6 items
 * - Item สุดท้ายจะแสดง "+N" overlay ถ้ามีเกิน 6 items
 *
 * Layout (6 items):
 * ┌─────┬─────┬─────┐
 * │  1  │  2  │  3  │
 * │ 1:1 │ 1:1 │ 1:1 │
 * ├─────┼─────┼─────┤
 * │  4  │  5  │ 6+N │
 * │ 1:1 │ 1:1 │ 1:1 │
 * └─────┴─────┴─────┘
 *
 * ✅ ใช้ aspect-square (1:1) สำหรับ responsive design
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
    <div
      className={cn(
        "grid grid-cols-3 gap-1",
        className
      )}
    >
      {displayMedia.map((item, index) => {
        const isLastItem = index === displayMedia.length - 1;
        const showOverlay = isLastItem && remainingCount > 0;

        return (
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
              showOverlay={showOverlay}
              remainingCount={remainingCount}
            />
          </div>
        );
      })}
    </div>
  );
}
