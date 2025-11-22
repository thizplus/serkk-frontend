"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
import { getMediaOrientation } from "@/shared/utils/mediaUtils";
import type { MediaItem, BaseMediaProps } from "./types";

interface SingleVideoPlayerProps extends BaseMediaProps {
  media: MediaItem;
}

/**
 * SingleVideoPlayer Component
 *
 * แสดง video เดียวพร้อม inline controls
 * ใช้ native HTML5 video player
 *
 * Features:
 * - ✅ Play/pause inline (ไม่ต้องเปิด lightbox)
 * - ✅ Native video controls (play, pause, volume, fullscreen)
 * - ✅ Responsive sizing (max-height based on variant)
 * - ✅ Poster image support
 * - ✅ Limited aspect ratio based on orientation (prevents too tall videos)
 * - ✅ Fallback to landscape if no dimensions
 *
 * Behavior:
 * - Feed mode: max-h-[600px]
 * - Detail mode: max-h-[800px]
 * - Landscape: 16:9 aspect ratio
 * - Portrait: 3:4 aspect ratio (not too tall!)
 * - Square: 1:1 aspect ratio
 * - Always show controls
 * - No lightbox wrapper
 *
 * @example
 * <SingleVideoPlayer
 *   media={{ id: '1', url: 'video.mp4', type: 'video', width: 1920, height: 1080 }}
 *   variant="feed"
 * />
 */
export function SingleVideoPlayer({
  media,
  variant = 'feed',
  className,
}: SingleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const maxHeight = variant === 'detail'
    ? MEDIA_DISPLAY.MAX_HEIGHT.DETAIL
    : MEDIA_DISPLAY.MAX_HEIGHT.FEED;

  // ✅ Detect fullscreen changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Listen to all fullscreen change events (cross-browser)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // ✅ Use limited aspect ratio based on orientation (prevents too tall videos)
  const orientation = getMediaOrientation(media.width, media.height);

  // Choose aspect ratio based on orientation
  let aspectRatioClass: string;
  if (orientation === 'landscape') {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.VIDEO_LANDSCAPE; // 16:9
  } else if (orientation === 'portrait') {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.VIDEO_PORTRAIT; // 3:4 (not too tall!)
  } else {
    aspectRatioClass = MEDIA_DISPLAY.ASPECT_RATIO.VIDEO_SQUARE; // 1:1
  }

  // 🔍 Debug: Check what orientation we detected
  console.log('🎬 SingleVideoPlayer - Orientation:', {
    id: media.id,
    url: media.url?.substring(0, 50) + '...',
    width: media.width,
    height: media.height,
    orientation,
    aspectRatioClass,
  });

  return (
    // ✅ Limited aspect ratio based on orientation (reasonable height)
    <div className={cn("w-full", className)} style={{ maxHeight: `${maxHeight}px` }}>
      <div className={aspectRatioClass}>
        <video
          ref={videoRef}
          src={media.url}
          poster={media.thumbnail}
          controls={MEDIA_DISPLAY.VIDEO.CONTROLS}
          preload={MEDIA_DISPLAY.VIDEO.PRELOAD}
          className={cn(
            "w-full h-full bg-black",
            // ✅ Feed: object-cover (ไม่มีขอบดำ, ตัดขอบนิดหน่อย)
            // ✅ Fullscreen: object-contain (แสดงเต็ม, อาจมีขอบดำ)
            isFullscreen ? "object-contain" : "object-cover"
          )}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
