"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Virtual } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { X } from "lucide-react";
import type { MediaViewerProps } from "../types";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/virtual';

/**
 * POC #4: Swiper.js
 *
 * Technology:
 * - Carousel: Swiper with `freeMode` + `virtual` (performance)
 * - Dismiss: Framer Motion `drag="y"`
 *
 * Pros:
 * - ✅ Feature-rich (most complete solution)
 * - ✅ Widely used, excellent documentation
 * - ✅ Virtual slides for better performance
 *
 * Cons:
 * - ⚠️ Larger bundle size (~140KB)
 * - ⚠️ May be overkill for simple use case
 */
export function POC4_Swiper({
  media,
  post, // Added for type compatibility
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentIndex(swiper.activeIndex);
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
            POC #4: Swiper.js
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

        {/* Swiper Container */}
        <div className="h-full flex items-center">
          <Swiper
            modules={[FreeMode, Virtual]}
            spaceBetween={0}
            slidesPerView={1}
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 1,
              momentumVelocityRatio: 1,
            }}
            virtual={{
              enabled: true,
              addSlidesAfter: 1,
              addSlidesBefore: 1,
            }}
            initialSlide={initialIndex}
            onSlideChange={handleSlideChange}
            className="w-full h-full"
          >
            {media.map((item, index) => (
              <SwiperSlide
                key={item.id}
                virtualIndex={index}
                className="flex items-center justify-center"
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
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Hint */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
          Swipe ← → to navigate • Swipe ↓ to close
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
