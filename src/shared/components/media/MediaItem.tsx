"use client";

import Image from "next/image";
import { Play, Video as VideoIcon, X } from "@/config/icons";
import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import type { MediaItemProps } from "./types";

/**
 * MediaItem Component
 *
 * Reusable component สำหรับแสดง media item เดียวใน grid
 * รองรับทั้ง image และ video
 *
 * Features:
 * - Video: แสดง thumbnail + play icon overlay + video badge
 * - Image: แสดง image ด้วย Next.js Image optimization
 * - Editable: แสดงปุ่ม remove (สำหรับ upload preview)
 * - Overlay: แสดง "+N" สำหรับ remaining items
 */
export function MediaItem({
  media,
  index,
  editable = false,
  onClick,
  onRemove,
  showOverlay = false,
  remainingCount = 0,
  className,
}: MediaItemProps) {
  const isVideo = media.type === 'video';

  const handleClick = () => {
    if (!editable && onClick) {
      onClick(index);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(index);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all bg-muted aspect-square",
        !editable && onClick && "cursor-pointer hover:scale-[1.02] transition-transform",
        className
      )}
      onClick={handleClick}
    >
      {/* Media Content */}
      {isVideo ? (
        <video
          src={media.url}
          poster={media.thumbnail}
          className="w-full h-full object-cover"
          muted={MEDIA_DISPLAY.VIDEO.MUTED_IN_GRID}
          preload={MEDIA_DISPLAY.VIDEO.PRELOAD}
        />
      ) : (
        <Image
          src={media.url}
          alt={`Media ${index + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}

      {/* Video Badge */}
      {isVideo && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-md flex items-center gap-1.5 shadow-lg">
          <VideoIcon size={14} />
          <span className="font-medium">Video</span>
        </div>
      )}

      {/* Play Icon Overlay (for videos) */}
      {isVideo && !editable && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Remove Button (editable mode) */}
      {editable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 p-2 bg-black/70 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/90"
          aria-label="Remove media"
        >
          <X size={18} />
        </button>
      )}

      {/* +N Overlay (remaining items) */}
      {showOverlay && remainingCount > 0 && (
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
}
