"use client";

import { cn } from "@/lib/utils";
import { MEDIA_DISPLAY } from "@/config/constants";
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
 * - ✅ aspect-video wrapper (16:9) for virtual scroll stability
 *
 * Behavior:
 * - Feed mode: max-h-[600px]
 * - Detail mode: max-h-[800px]
 * - Always show controls
 * - No lightbox wrapper
 *
 * @example
 * <SingleVideoPlayer
 *   media={{ id: '1', url: 'video.mp4', type: 'video', thumbnail: 'thumb.jpg' }}
 *   variant="feed"
 * />
 */
export function SingleVideoPlayer({
  media,
  variant = 'feed',
  className,
}: SingleVideoPlayerProps) {
  const maxHeight = variant === 'detail'
    ? MEDIA_DISPLAY.MAX_HEIGHT.DETAIL
    : MEDIA_DISPLAY.MAX_HEIGHT.FEED;

  return (
    // ✅ Expert Recommendation: aspect-video wrapper + max-height for predictable height
    <div className={cn("w-full", className)} style={{ maxHeight: `${maxHeight}px` }}>
      <div className={MEDIA_DISPLAY.ASPECT_RATIO.VIDEO}> {/* aspect-video */}
        <video
          src={media.url}
          poster={media.thumbnail}
          controls={MEDIA_DISPLAY.VIDEO.CONTROLS}
          preload={MEDIA_DISPLAY.VIDEO.PRELOAD}
          className="w-full h-full bg-black"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
