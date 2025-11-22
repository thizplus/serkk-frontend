"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { getMediaOrientation } from "@/shared/utils/mediaUtils";
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
 * - ✅ Limited aspect ratio based on orientation (prevents too tall images)
 * - ✅ Fallback to landscape if no dimensions
 *
 * Behavior:
 * - Feed mode: max-h-[600px]
 * - Detail mode: max-h-[800px]
 * - Landscape: 4:3 aspect ratio
 * - Portrait: 4:5 aspect ratio (not too tall!)
 * - Square: 1:1 aspect ratio
 * - Always clickable for lightbox
 * - Hover opacity effect
 *
 * @example
 * <SingleImageViewer
 *   media={{ id: '1', url: 'image.jpg', type: 'image', width: 1920, height: 1080 }}
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

  // ✅ Use limited aspect ratio based on orientation (prevents too tall images)
  const orientation = getMediaOrientation(media.width, media.height);

  // Choose aspect ratio based on orientation
  let aspectRatioClass: string;
  if (orientation === 'landscape') {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.IMAGE_LANDSCAPE; // 4:3
  } else if (orientation === 'portrait') {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.IMAGE_PORTRAIT; // 4:5 (not too tall!)
  } else {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.IMAGE_SQUARE; // 1:1
  }

  return (
    <>
      {/* ✅ Limited aspect ratio based on orientation (reasonable height) */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          !disableLightbox && "cursor-pointer hover:opacity-95 transition-opacity",
          aspectRatioClass,
          className
        )}
        style={{ maxHeight: `${maxHeight}px` }}
        onClick={handleClick}
      >
        <img
          src={media.url}
          alt="Post image"
          className="w-full h-full object-cover transition-opacity"
          loading="lazy"
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
