"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X } from "lucide-react";
import type { MediaViewerProps } from "../types";

/**
 * POC #3: Embla Carousel (dragFree mode)
 *
 * Technology:
 * - Carousel: Embla with `dragFree: true` (free scroll)
 * - Dismiss: Framer Motion `drag="y"`
 * - Physics: Embla's momentum system
 *
 * Pros:
 * - ✅ Lightweight (6KB)
 * - ✅ Good momentum physics
 * - ✅ Plugin system for extensibility
 *
 * Cons:
 * - ⚠️ Need separate library for dismiss gesture
 * - ⚠️ More configuration required
 */
export function POC3_Embla({
  media,
  post, // Added for type compatibility
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,        // Free scroll mode (no snap)
    containScroll: false,  // Allow over-scroll
    startIndex: initialIndex,
  });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Update current index when scroll stops
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Listen to scroll events
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('settle', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('settle', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to initial index when opening
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
    }
  }, [open, initialIndex, emblaApi]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white text-sm font-medium">
            POC #3: Embla Carousel
          </div>
          <div className="text-white/70 text-sm">
            {currentIndex + 1} / {media.length}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Embla Viewport */}
        <div className="h-full overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {media.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 flex-grow-0 w-screen h-full flex items-center justify-center"
              >
                {item.type === 'video' ? (
                  <video
                    poster={item.thumbnail}
                    controls
                    playsInline
                    preload={Math.abs(index - currentIndex) <= 1 ? 'auto' : 'metadata'}
                    className="max-w-full max-h-full"
                  >
                    <source src={item.url} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
          Drag ← → to navigate • Swipe ↓ to close
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
