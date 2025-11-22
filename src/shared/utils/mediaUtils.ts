/**
 * Media Utilities
 *
 * Helper functions สำหรับจัดการ media orientation และ aspect ratios
 */

export type MediaOrientation = 'landscape' | 'portrait' | 'square';

/**
 * คำนวณ orientation ของ media จาก width และ height
 *
 * @param width - ความกว้างของ media (pixels)
 * @param height - ความสูงของ media (pixels)
 * @returns orientation type
 *
 * @example
 * getMediaOrientation(1920, 1080) // 'landscape' (16:9)
 * getMediaOrientation(1080, 1920) // 'portrait' (9:16)
 * getMediaOrientation(1080, 1080) // 'square' (1:1)
 */
export function getMediaOrientation(
  width?: number,
  height?: number
): MediaOrientation {
  // ถ้าไม่มี metadata → default เป็น square (1:1) - เป็นกลางที่สุด
  if (!width || !height) {
    return 'square';
  }

  const ratio = width / height;

  // Landscape: width > height (ratio > 1.1)
  if (ratio > 1.1) {
    return 'landscape';
  }

  // Portrait: height > width (ratio < 0.9)
  if (ratio < 0.9) {
    return 'portrait';
  }

  // Square: width ≈ height (0.9 ≤ ratio ≤ 1.1)
  return 'square';
}

/**
 * แปลง orientation เป็น Tailwind aspect ratio class
 *
 * @param orientation - orientation ของ media
 * @param type - ประเภทของ media ('image' | 'video')
 * @returns Tailwind CSS class name
 *
 * @example
 * getAspectRatioClass('landscape', 'video') // 'aspect-video' (16:9)
 * getAspectRatioClass('portrait', 'video')  // 'aspect-[3/4]' (3:4)
 * getAspectRatioClass('square', 'image')    // 'aspect-square' (1:1)
 */
export function getAspectRatioClass(
  orientation: MediaOrientation,
  type: 'image' | 'video'
): string {
  if (type === 'video') {
    switch (orientation) {
      case 'landscape':
        return 'aspect-video';      // 16:9 (YouTube landscape)
      case 'portrait':
        return 'aspect-[3/4]';      // 3:4 (TikTok, Instagram Reels)
      case 'square':
        return 'aspect-square';     // 1:1 (Instagram square)
    }
  } else {
    // Image
    switch (orientation) {
      case 'landscape':
        return 'aspect-[4/3]';      // 4:3 (slightly landscape)
      case 'portrait':
        return 'aspect-[4/5]';      // 4:5 (Instagram portrait)
      case 'square':
        return 'aspect-square';     // 1:1
    }
  }
}

/**
 * Format duration (seconds) เป็น string MM:SS หรือ HH:MM:SS
 *
 * @param seconds - ระยะเวลาเป็นวินาที
 * @returns formatted string
 *
 * @example
 * formatDuration(65)    // '1:05'
 * formatDuration(3665)  // '1:01:05'
 * formatDuration(45)    // '0:45'
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) {
    return '0:00';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // ถ้ามีชั่วโมง → HH:MM:SS
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ไม่มีชั่วโมง → M:SS
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * ตรวจสอบว่า URL เป็น video หรือ image
 *
 * @param url - URL ของไฟล์
 * @returns 'video' | 'image' | 'unknown'
 *
 * @example
 * detectMediaTypeFromUrl('video.mp4')  // 'video'
 * detectMediaTypeFromUrl('image.jpg')  // 'image'
 */
export function detectMediaTypeFromUrl(url: string): 'video' | 'image' | 'unknown' {
  const urlLower = url.toLowerCase();

  // Video extensions
  if (/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(urlLower)) {
    return 'video';
  }

  // Image extensions
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(urlLower)) {
    return 'image';
  }

  return 'unknown';
}
