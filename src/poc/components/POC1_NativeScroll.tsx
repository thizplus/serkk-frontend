"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { MediaViewerProps } from "../types";

/**
 * POC #1: Native Scroll + Framer Motion (Hybrid)
 *
 * Technology:
 * - Horizontal: Native CSS `overflow-x-scroll` (Browser optimized)
 * - Vertical: Framer Motion `drag="y"` (Swipe down to dismiss)
 * - Video: Lazy load with visibility tracking
 *
 * Pros:
 * - ✅ Smoothest horizontal scroll (native browser)
 * - ✅ Best video performance
 * - ✅ Built-in momentum physics
 *
 * Cons:
 * - ⚠️ Potential conflict between vertical drag and horizontal scroll
 */
export function POC1_NativeScroll({
  media,
  post, // Added for type compatibility
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Scroll to initial index on open
  useEffect(() => {
    if (open && scrollRef.current) {
      const width = window.innerWidth;
      scrollRef.current.scrollTo({
        left: width * initialIndex,
        behavior: 'auto',
      });
    }
  }, [open, initialIndex]);

  // Track current index based on scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = window.innerWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentIndex(index);
  };

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
            POC #1: Native Scroll
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

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-x-scroll snap-x snap-proximity scrollbar-hide"
          style={{
            scrollSnapType: 'x proximity',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
          }}
        >
          <div className="flex h-full">
            {media.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-screen h-full flex items-center justify-center snap-center"
              >
                {item.type === 'video' ? (
                  <LazyVideo
                    src={item.url}
                    poster={item.thumbnail}
                    isActive={Math.abs(index - currentIndex) <= 1}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                    style={{
                      transform: 'translateZ(0)',
                      willChange: 'transform',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
          Swipe ← → to navigate • Swipe ↓ to close
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Lazy Video Component
 * Only loads video when it's about to be visible
 */
function LazyVideo({
  src,
  poster,
  isActive,
}: {
  src: string;
  poster?: string;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      preload={isActive ? 'auto' : 'metadata'}
      className="max-w-full max-h-full"
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
