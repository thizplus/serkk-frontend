"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { MediaLightbox } from "./MediaLightbox";
import type { MediaItem, BaseMediaProps } from "./types";

interface SingleImageViewerProps extends BaseMediaProps {
  media: MediaItem;
  disableLightbox?: boolean;
}

/**
 * SingleImageViewer Component
 *
 * แสดง image เดียวพร้อม lightbox สำหรับ zoom
 *
 * Features:
 * - ✅ Click to open lightbox
 * - ✅ Zoom support (3x)
 * - ✅ Keyboard navigation (ESC to close)
 * - ✅ Responsive sizing (max-height based on variant)
 *
 * Behavior:
 * - Feed mode: max-h-[600px]
 * - Detail mode: max-h-[800px]
 * - Always clickable for lightbox
 * - Hover opacity effect
 *
 * @example
 * <SingleImageViewer
 *   media={{ id: '1', url: 'image.jpg', type: 'image' }}
 *   variant="feed"
 * />
 */
export function SingleImageViewer({
  media,
  variant = 'feed',
  className,
  disableLightbox = false,
}: SingleImageViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const maxHeight = variant === 'detail'
    ? MEDIA_DISPLAY.MAX_HEIGHT.DETAIL
    : MEDIA_DISPLAY.MAX_HEIGHT.FEED;

  const handleClick = () => {
    if (!disableLightbox) {
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "w-full overflow-hidden",
          !disableLightbox && "cursor-pointer hover:opacity-95 transition-opacity",
          className
        )}
        onClick={handleClick}
      >
        <img
          src={media.url}
          alt="Post image"
          className={cn(
            "max-w-full h-auto object-contain",
            `max-h-[${maxHeight}px]`
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        />
      </div>

      {/* Lightbox for zoom - only if not disabled */}
      {!disableLightbox && (
        <MediaLightbox
          media={[media]}
          open={lightboxOpen}
          index={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
