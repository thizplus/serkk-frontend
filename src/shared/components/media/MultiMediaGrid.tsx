"use client";

import { useState, useMemo } from "react";
import { GridLayout2 } from "./GridLayout2";
import { GridLayout3 } from "./GridLayout3";
import { GridLayout4 } from "./GridLayout4";
import { GridLayout5Plus } from "./GridLayout5Plus";
import { MediaLightbox } from "./MediaLightbox";
import type { MediaDisplayProps } from "./types";

/**
 * MultiMediaGrid Component
 *
 * Smart component สำหรับแสดง multiple media items
 * เลือก GridLayout ที่เหมาะสมตามจำนวน media
 *
 * Features:
 * - ✅ Dynamic layout selection (2, 3, 4, 5+ items)
 * - ✅ Single lightbox instance (ไม่ duplicate)
 * - ✅ Carousel navigation
 * - ✅ Keyboard support (arrows, ESC)
 * - ✅ Editable mode support
 *
 * Layout Selection:
 * - 2 items → GridLayout2 (2 columns)
 * - 3 items → GridLayout3 (1 large + 2 small)
 * - 4 items → GridLayout4 (2x2 grid)
 * - 5+ items → GridLayout5Plus (Instagram style)
 *
 * @example
 * <MultiMediaGrid
 *   media={[...]}
 *   variant="feed"
 *   editable={false}
 * />
 */
export function MultiMediaGrid({
  media,
  variant = 'feed',
  editable = false,
  onRemove,
  className,
}: MediaDisplayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Handle media click - open lightbox
  const handleMediaClick = (index: number) => {
    if (!editable) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Choose appropriate layout based on media count
  const LayoutComponent = useMemo(() => {
    switch (media.length) {
      case 2:
        return GridLayout2;
      case 3:
        return GridLayout3;
      case 4:
        return GridLayout4;
      default:
        return GridLayout5Plus;
    }
  }, [media.length]);

  return (
    <>
      {/* Grid Layout */}
      <LayoutComponent
        media={media}
        variant={variant}
        editable={editable}
        onMediaClick={handleMediaClick}
        onRemove={onRemove}
        className={className}
      />

      {/* Single Lightbox Instance (only in non-editable mode) */}
      {!editable && (
        <MediaLightbox
          media={media}
          open={lightboxOpen}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
