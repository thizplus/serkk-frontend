"use client";

import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MediaViewerProps } from "../types";

/**
 * POC #2: Framer Motion Drag (Pure)
 *
 * Technology:
 * - Horizontal: Framer Motion `drag="x"` with constraints
 * - Vertical: Framer Motion `drag="y"` (dismiss gesture)
 * - Physics: Built-in momentum and spring animations
 *
 * Pros:
 * - ✅ Easy gesture handling
 * - ✅ Smooth animations
 * - ✅ Separate horizontal/vertical drag
 *
 * Cons:
 * - ⚠️ May have performance issues with heavy video
 * - ⚠️ Need to calculate constraints manually
 */
export function POC2_FramerMotion({
  media,
  post, // Added for type compatibility
  open,
  initialIndex = 0,
  onClose,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const x = useMotionValue(0);

  // Calculate max scroll width
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const maxScroll = -(containerWidth * (media.length - 1));

  // Reset position when opening
  useEffect(() => {
    if (open) {
      x.set(-containerWidth * initialIndex);
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex, containerWidth, x]);

  // Update current index when drag ends
  const handleDragEnd = () => {
    const currentX = x.get();
    const index = Math.round(-currentX / containerWidth);
    setCurrentIndex(Math.max(0, Math.min(index, media.length - 1)));
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
            POC #2: Framer Motion
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

        {/* Draggable Container */}
        <div className="h-full overflow-hidden flex items-center">
          <motion.div
            drag="x"
            dragConstraints={{ left: maxScroll, right: 0 }}
            dragElastic={0.2}
            dragMomentum={true}
            dragTransition={{
              power: 0.3,
              timeConstant: 200,
            }}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="flex h-full"
          >
            {media.map((item, index) => (
              <div
                key={item.id}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: containerWidth, height: '100%' }}
              >
                {item.type === 'video' ? (
                  <video
                    poster={item.thumbnail}
                    controls
                    playsInline
                    preload={Math.abs(index - currentIndex) <= 1 ? 'auto' : 'metadata'}
                    className="max-w-full max-h-full pointer-events-auto"
                  >
                    <source src={item.url} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="max-w-full max-h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hint */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
          Drag ← → to navigate • Swipe ↓ to close
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
