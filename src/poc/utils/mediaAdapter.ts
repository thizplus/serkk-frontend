import type { Media } from "@/types/models";
import type { MediaItem } from "../types";

/**
 * Convert Post Media to POC MediaItem format
 *
 * Handles:
 * - Image media
 * - Video media (with HLS streaming support)
 * - Thumbnail generation
 * - Filters out non-image/video media (e.g., files)
 */
export function convertPostMediaToMediaItems(media: Media[]): MediaItem[] {
  return media
    .filter((item) => item.type === 'image' || item.type === 'video')
    .map((item) => {
      // For videos, prefer HLS URL if available
      const videoUrl = item.type === 'video' && item.hlsUrl
        ? item.hlsUrl
        : item.url;

      return {
        id: item.id,
        type: item.type as 'image' | 'video', // Safe cast after filter
        url: videoUrl,
        thumbnail: item.thumbnail || undefined,
      };
    });
}

/**
 * Check if post has media
 */
export function postHasMedia(media: Media[]): boolean {
  return media && media.length > 0;
}

/**
 * Get first media item (for thumbnail preview)
 */
export function getFirstMedia(media: Media[]): Media | null {
  return media && media.length > 0 ? media[0] : null;
}
