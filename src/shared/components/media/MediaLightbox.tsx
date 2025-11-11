"use client";

import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface MediaLightboxProps {
  media: MediaItem[];
  open: boolean;
  index: number;
  onClose: () => void;
}

/**
 * MediaLightbox Component
 *
 * Lightbox สำหรับแสดงรูปภาพและวิดีโอแบบเต็มหน้าจอ
 * รองรับ:
 * - Image slides
 * - Video slides (HTML5 video player)
 * - Zoom (สำหรับรูปภาพ)
 * - Keyboard navigation (arrows, ESC)
 * - Carousel (เลื่อนดูต่อเนื่อง)
 */
export function MediaLightbox({
  media,
  open,
  index,
  onClose,
}: MediaLightboxProps) {
  // Convert media items to lightbox slides
  const slides = media.map((item) => {
    if (item.type === 'video') {
      // Video slide
      return {
        type: 'video' as const,
        width: 1920,
        height: 1080,
        poster: item.thumbnail,
        sources: [
          {
            src: item.url,
            type: 'video/mp4',
          },
        ],
      };
    } else {
      // Image slide
      return {
        src: item.url,
        alt: 'Media',
      };
    }
  });

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Video, Zoom]}
      // Video plugin settings
      video={{
        controls: true,
        autoPlay: false,
        playsInline: true,
      }}
      // Zoom plugin settings (for images only)
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true,
      }}
      // Carousel settings
      carousel={{
        finite: false, // Allow infinite loop
      }}
      // Animation settings
      animation={{
        fade: 250,
        swipe: 250,
      }}
      // Controller settings
      controller={{
        closeOnBackdropClick: true,
      }}
    />
  );
}
