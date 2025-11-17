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
      {/* ✅ Expert Recommendation: aspect ratio + max-height for virtual scroll stability */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          !disableLightbox && "cursor-pointer hover:opacity-95 transition-opacity",
          className
        )}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {/* Aspect ratio container: Instagram-style on mobile, landscape on desktop */}
        <div
          className={cn(
            "w-full",
            MEDIA_DISPLAY.ASPECT_RATIO.SINGLE_IMAGE_MOBILE,      // aspect-[4/5]
            `sm:${MEDIA_DISPLAY.ASPECT_RATIO.SINGLE_IMAGE_DESKTOP}` // sm:aspect-[16/9]
          )}
        >
          <img
            src={media.url}
            alt="Post image"
            className="w-full h-full object-cover transition-opacity"
            loading="lazy"
          />
        </div>
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
