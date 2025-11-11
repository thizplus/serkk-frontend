"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Video as VideoIcon, Play } from "@/config/icons";
import { cn } from "@/lib/utils";
import { FORM_LIMITS } from "@/config";
import { MediaLightbox } from "./MediaLightbox";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface MediaGridProps {
  media: MediaItem[];
  maxDisplay?: number; // Default: FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY
  onClick?: (index: number) => void;
  onRemove?: (index: number) => void;
  editable?: boolean; // Show remove buttons
  variant?: 'feed' | 'detail'; // Display mode: feed (compact) or detail (full)
  className?: string;
}

/**
 * MediaGrid Component - Instagram-style media layout
 *
 * Layout Strategy (Natural Aspect Ratio):
 * - 1 file: Single full width, natural height (max 600px feed / 800px detail)
 * - 2 files: 2 columns with aspect-square
 * - 3 files: 1 large left, 2 stacked right (aspect-square)
 * - 4 files: 2x2 grid (aspect-square)
 * - 5+ files: Mixed layout with overlay on last
 *
 * Variant Modes:
 * - 'feed': Compact mode สำหรับหน้าหลัก (max-h-600px, มี lightbox เสมอ)
 * - 'detail': Full mode สำหรับหน้า detail (max-h-800px, smart lightbox behavior)
 *
 * Single Media Behavior:
 * - Feed mode: คลิกเปิด lightbox (ทั้ง image และ video)
 * - Detail mode:
 *   - Single Image: แสดง scale จริง (object-contain) max-h-800px, คลิกเปิด lightbox สำหรับ zoom
 *   - Single Video: แสดง controls, play ได้เลย, ไม่มี lightbox, ไม่มี play icon overlay
 *   - Multiple Media: ใช้ grid + lightbox เหมือน feed mode
 */
export function MediaGrid({
  media,
  maxDisplay = FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY,
  onClick,
  onRemove,
  editable = false,
  variant = 'feed',
  className,
}: MediaGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const displayMedia = media.slice(0, maxDisplay);
  const remainingCount = Math.max(0, media.length - maxDisplay);

  // ✅ Check if single VIDEO in detail mode (ไม่ต้องใช้ lightbox - play ได้เลย)
  const isSingleVideoDetailMode = variant === 'detail' && media.length === 1 && media[0].type === 'video';
  // ✅ Single IMAGE ยังใช้ lightbox ได้ (สำหรับ zoom)
  const shouldUseLightbox = !editable && !isSingleVideoDetailMode;

  // Get grid layout class based on count
  const getGridClass = () => {
    const count = displayMedia.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-2"; // 1 left, 2 right
    if (count === 4) return "grid-cols-2"; // 2x2
    return "grid-cols-2"; // 5+: mixed layout
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const isVideo = item.type === 'video';
    const isLastItem = index === displayMedia.length - 1;
    const showOverlay = isLastItem && remainingCount > 0;

    // Special span for layouts
    let spanClass = "";
    let rowSpanClass = "";
    const totalCount = displayMedia.length;

    if (totalCount === 3 && index === 0) {
      // First item in 3-item layout: spans 2 rows (large left)
      rowSpanClass = "row-span-2";
    } else if (totalCount === 5 && index === 0) {
      // First item in 5-item layout: large top-left
      rowSpanClass = "row-span-2";
    } else if (totalCount === 5 && index >= 3) {
      // Last 2 items in 5-item layout: smaller
      spanClass = "col-span-1";
    }

    return (
      <div
        key={item.id || `media-${index}`}
        className={cn(
          "relative rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all",
          spanClass,
          rowSpanClass,
          // Single item: แสดงแบบ natural (ไม่ crop, ไม่มี fixed aspect)
          totalCount === 1 && "w-full bg-black flex items-center justify-center",
          // Multiple items: ใช้ aspect-square + bg-muted
          totalCount >= 2 && "bg-muted aspect-square",
          // Cursor: ถ้า single video detail mode ไม่ต้อง cursor pointer
          !editable && !isSingleVideoDetailMode && "cursor-pointer hover:scale-[1.02] transition-transform"
        )}
        onClick={() => {
          if (!editable && !isSingleVideoDetailMode) {
            if (onClick) {
              onClick(index);
            } else {
              // Open lightbox if no custom onClick handler
              setLightboxIndex(index);
              setLightboxOpen(true);
            }
          }
        }}
      >
        {isVideo ? (
          totalCount === 1 ? (
            // Single video: ใช้ native video, แสดง scale จริง
            <>
              <video
                src={item.url}
                poster={item.thumbnail}
                className={cn(
                  "rounded-lg",
                  variant === 'detail' ? "max-h-[800px]" : "max-h-[600px]",
                  "max-w-full h-auto"
                )}
                controls={isSingleVideoDetailMode}
                muted={!isSingleVideoDetailMode}
                preload="metadata"
              />
              {/* Play Icon Overlay - ซ่อนถ้า single video detail mode */}
              {!isSingleVideoDetailMode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="h-8 w-8 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
              {/* Video Badge - ซ่อนถ้า single video detail mode */}
              {!isSingleVideoDetailMode && (
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-md flex items-center gap-1.5 shadow-lg">
                  <VideoIcon size={14} />
                  <span className="font-medium">Video</span>
                </div>
              )}
            </>
          ) : (
            // Multiple videos: ใช้ video + object-cover
            <div className="relative w-full h-full">
              <video
                src={item.url}
                poster={item.thumbnail}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              {/* Play Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </div>
              </div>
              {/* Video Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-md flex items-center gap-1.5 shadow-lg">
                <VideoIcon size={14} />
                <span className="font-medium">Video</span>
              </div>
            </div>
          )
        ) : (
          totalCount === 1 ? (
            // Single image: ใช้ native img, แสดง scale จริง
            <img
              src={item.url}
              alt={`Media ${index + 1}`}
              className={cn(
                "rounded-lg",
                variant === 'detail' ? "max-h-[800px]" : "max-h-[600px]",
                "max-w-full h-auto object-contain"
              )}
            />
          ) : (
            // Multiple images: ใช้ Next.js Image + object-cover
            <div className="relative w-full h-full">
              <Image
                src={item.url}
                alt={`Media ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )
        )}

        {/* Remove Button (editable mode) */}
        {editable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="absolute top-2 right-2 p-2 bg-black/70 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/90"
          >
            <X size={18} />
          </button>
        )}

        {/* Overlay for remaining items */}
        {showOverlay && (
          <div className="absolute rounded-lg overflow-hidden inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/80 transition-colors">
            <div className="text-center">
              <span className="text-white text-5xl font-bold">+{remainingCount}</span>
              <p className="text-white/90 text-sm mt-2">รูปภาพเพิ่มเติม</p>
            </div>
          </div>
        )}

        {/* Hover Overlay (non-editable mode) */}
        {!editable && onClick && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors pointer-events-none" />
        )}
      </div>
    );
  };

  // Special grid structure for 3 items (1 large left, 2 right)
  if (displayMedia.length === 3) {
    return (
      <>
        <div className={cn("grid grid-cols-2 gap-2", className)}>
          {/* Large left image */}
          {renderMediaItem(displayMedia[0], 0)}
          {/* Right column: 2 stacked images */}
          <div className="grid grid-rows-2 gap-2">
            {renderMediaItem(displayMedia[1], 1)}
            {renderMediaItem(displayMedia[2], 2)}
          </div>
        </div>
        {shouldUseLightbox && (
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

  // Special grid structure for 5+ items (Instagram-style)
  if (displayMedia.length === 5) {
    return (
      <>
        <div className={cn("grid grid-cols-3 gap-2", className)}>
          {/* Large left (spans 2 rows, 2 cols) */}
          <div className="col-span-2 row-span-2">
            {renderMediaItem(displayMedia[0], 0)}
          </div>
          {/* Right top */}
          {renderMediaItem(displayMedia[1], 1)}
          {/* Right middle */}
          {renderMediaItem(displayMedia[2], 2)}
          {/* Bottom left */}
          {renderMediaItem(displayMedia[3], 3)}
          {/* Bottom right (with overlay if more items) */}
          {renderMediaItem(displayMedia[4], 4)}
        </div>
        {shouldUseLightbox && (
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

  // Single item - full width with max height
  if (displayMedia.length === 1) {
    return (
      <>
        <div className={cn("w-full overflow-hidden rounded-lg", className)}>
          {renderMediaItem(displayMedia[0], 0)}
        </div>
        {shouldUseLightbox && (
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

  // 2 items - side by side
  if (displayMedia.length === 2) {
    return (
      <>
        <div className={cn("grid grid-cols-2 gap-2", className)}>
          {displayMedia.map((item, index) => renderMediaItem(item, index))}
        </div>
        {shouldUseLightbox && (
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

  // 4 items - 2x2 grid
  if (displayMedia.length === 4) {
    return (
      <>
        <div className={cn("grid grid-cols-2 gap-2", className)}>
          {displayMedia.map((item, index) => renderMediaItem(item, index))}
        </div>
        {shouldUseLightbox && (
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

  // Default fallback
  return (
    <>
      <div className={cn("grid gap-2", getGridClass(), className)}>
        {displayMedia.map((item, index) => renderMediaItem(item, index))}
      </div>
      {shouldUseLightbox && (
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
