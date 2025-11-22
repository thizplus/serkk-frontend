/**
 * Extract Metadata from Media Files
 *
 * Utility functions to extract width, height, and duration
 * from images and videos on the client-side
 */

export interface ImageMetadata {
  width: number;
  height: number;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // in seconds
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Extract metadata from an image file
 *
 * @param file - Image file (JPEG, PNG, GIF, WebP, etc.)
 * @returns Promise with width and height
 *
 * @example
 * const metadata = await extractImageMetadata(imageFile);
 * console.log(metadata); // { width: 1920, height: 1080 }
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);

      // Extract dimensions
      const metadata: ImageMetadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };

      resolve(metadata);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Extract metadata from a video file
 *
 * @param file - Video file (MP4, WebM, MOV, etc.)
 * @returns Promise with width, height, and duration
 *
 * @example
 * const metadata = await extractVideoMetadata(videoFile);
 * console.log(metadata); // { width: 1920, height: 1080, duration: 30.5 }
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      reject(new Error('File is not a video'));
      return;
    }

    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    // Set preload to metadata only (don't download entire video)
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);

      // Extract dimensions and duration
      const metadata: VideoMetadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration, // in seconds
      };

      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = objectUrl;
  });
}

/**
 * Extract metadata from any media file (image or video)
 *
 * Automatically detects file type and extracts appropriate metadata
 *
 * @param file - Image or video file
 * @returns Promise with metadata (width, height, duration?)
 *
 * @example
 * const metadata = await extractMediaMetadata(file);
 * if (metadata.duration) {
 *   console.log('Video:', metadata); // { width, height, duration }
 * } else {
 *   console.log('Image:', metadata); // { width, height }
 * }
 */
export async function extractMediaMetadata(file: File): Promise<MediaMetadata> {
  try {
    if (file.type.startsWith('image/')) {
      const imageMetadata = await extractImageMetadata(file);
      return {
        width: imageMetadata.width,
        height: imageMetadata.height,
      };
    } else if (file.type.startsWith('video/')) {
      const videoMetadata = await extractVideoMetadata(file);
      return {
        width: videoMetadata.width,
        height: videoMetadata.height,
        duration: videoMetadata.duration,
      };
    } else {
      // Not a media file, return empty metadata
      return {};
    }
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    // Return empty metadata on error (graceful degradation)
    return {};
  }
}

/**
 * Extract metadata from multiple files concurrently
 *
 * @param files - Array of image/video files
 * @returns Promise with array of metadata
 *
 * @example
 * const metadataList = await extractBatchMetadata(files);
 * metadataList.forEach((meta, i) => {
 *   console.log(`File ${i}:`, meta);
 * });
 */
export async function extractBatchMetadata(files: File[]): Promise<MediaMetadata[]> {
  const promises = files.map(file => extractMediaMetadata(file));
  return Promise.all(promises);
}

/**
 * Calculate aspect ratio from width and height
 *
 * @param width - Image/video width
 * @param height - Image/video height
 * @returns Aspect ratio as a number (width / height)
 *
 * @example
 * const ratio = calculateAspectRatio(1920, 1080); // 1.778 (16:9)
 * const ratio = calculateAspectRatio(1080, 1920); // 0.563 (9:16)
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (height === 0) return 0;
  return width / height;
}

/**
 * Determine orientation from width and height
 *
 * @param width - Image/video width
 * @param height - Image/video height
 * @returns 'landscape' | 'portrait' | 'square'
 *
 * @example
 * getOrientation(1920, 1080); // 'landscape'
 * getOrientation(1080, 1920); // 'portrait'
 * getOrientation(1080, 1080); // 'square'
 */
export function getOrientation(width: number, height: number): 'landscape' | 'portrait' | 'square' {
  const ratio = calculateAspectRatio(width, height);
  if (ratio > 1.1) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
}

/**
 * Format duration from seconds to human-readable format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (MM:SS or HH:MM:SS)
 *
 * @example
 * formatDuration(90);    // "1:30"
 * formatDuration(3665);  // "1:01:05"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
