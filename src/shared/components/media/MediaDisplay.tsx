"use client";

import { useMemo } from "react";
import { SingleVideoPlayer } from "./SingleVideoPlayer";
import { SingleImageViewer } from "./SingleImageViewer";
import { MultiMediaGrid } from "./MultiMediaGrid";
import type { MediaDisplayProps } from "./types";

/**
 * MediaDisplay Component (Smart Component)
 *
 * Main entry point สำหรับแสดง media
 * วิเคราะห์ media array และเลือก component ที่เหมาะสม
 *
 * Decision Logic:
 * - Single video (non-editable) → SingleVideoPlayer (inline play, no lightbox)
 * - Single image → SingleImageViewer (with lightbox for zoom)
 * - Multiple media → MultiMediaGrid (with lightbox carousel)
 * - Editable mode → MultiMediaGrid (with remove buttons, no lightbox)
 *
 * Features:
 * ✅ Smart routing to appropriate component
 * ✅ Optimized UX based on media type
 * ✅ Support for feed and detail variants
 * ✅ Editable mode for upload preview
 *
 * @example
 * // Single video in feed (plays inline)
 * <MediaDisplay
 *   media={[{ id: '1', url: 'video.mp4', type: 'video' }]}
 *   variant="feed"
 * />
 *
 * @example
 * // Multiple images with lightbox
 * <MediaDisplay
 *   media={[
 *     { id: '1', url: 'img1.jpg', type: 'image' },
 *     { id: '2', url: 'img2.jpg', type: 'image' },
 *   ]}
 *   variant="detail"
 * />
 *
 * @example
 * // Editable mode (upload preview)
 * <MediaDisplay
 *   media={uploadedFiles}
 *   editable={true}
 *   onRemove={(index) => removeFile(index)}
 * />
 */
export function MediaDisplay({
  media,
  variant = 'feed',
  editable = false,
  onRemove,
  className,
  disableLightbox = false,
}: MediaDisplayProps) {
  // Calculate media composition
  const mediaStats = useMemo(() => ({
    total: media.length,
    videos: media.filter(m => m.type === 'video').length,
    images: media.filter(m => m.type === 'image').length,
    isSingleVideo: media.length === 1 && media[0].type === 'video',
    isSingleImage: media.length === 1 && media[0].type === 'image',
  }), [media]);

  // Empty state
  if (media.length === 0) {
    return null;
  }

  // Route to appropriate component
  // Single video (non-editable) → inline player
  if (mediaStats.isSingleVideo && !editable) {
    return (
      <SingleVideoPlayer
        media={media[0]}
        variant={variant}
        className={className}
      />
    );
  }

  // Single image → viewer with lightbox
  if (mediaStats.isSingleImage && !editable) {
    return (
      <SingleImageViewer
        media={media[0]}
        variant={variant}
        className={className}
        disableLightbox={disableLightbox}
      />
    );
  }

  // Multiple media OR editable mode → grid with lightbox
  return (
    <MultiMediaGrid
      media={media}
      variant={variant}
      editable={editable}
      onRemove={onRemove}
      className={className}
      disableLightbox={disableLightbox}
    />
  );
}
