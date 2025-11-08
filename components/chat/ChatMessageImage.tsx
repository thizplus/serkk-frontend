"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageMedia } from "@/lib/data/mockChats";
import type { ChatMessageMedia } from "@/lib/types/models";

interface ChatMessageImageProps {
  media: MessageMedia[] | ChatMessageMedia[];
  isOwnMessage: boolean;
  isUploading?: boolean;
}

export function ChatMessageImage({ media, isOwnMessage, isUploading }: ChatMessageImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Check if uploading (preview URL starts with blob:)
  const isPreview = media.length > 0 && media[0].url.startsWith('blob:');

  const handleImageClick = (index: number) => {
    // Don't open lightbox if still uploading
    if (isPreview) return;
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  // Convert media to lightbox slides
  const slides = media.map((image) => ({
    src: image.url,
    alt: "Shared image",
  }));

  const imageCount = media.length;

  // Single image
  if (imageCount === 1) {
    const image = media[0];
    return (
      <>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg group",
            !isPreview && "cursor-pointer"
          )}
          onClick={() => handleImageClick(0)}
          style={{ maxWidth: "300px" }}
        >
          <img
            src={image.thumbnail || image.url}
            alt="Shared image"
            className={cn(
              "w-full h-auto object-cover rounded-lg",
              !isPreview && "transition-transform group-hover:scale-105"
            )}
            style={{ maxHeight: "400px" }}
          />

          {/* Uploading overlay */}
          {isPreview && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
                <span className="text-white text-sm font-medium">กำลังส่ง...</span>
              </div>
            </div>
          )}

          {!isPreview && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          )}
        </div>

        {/* Lightbox */}
        {!isPreview && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={slides}
            index={selectedIndex}
          />
        )}
      </>
    );
  }

  // Multiple images (2-4 images grid)
  return (
    <>
      <div
        className={cn(
          "grid gap-1 rounded-lg overflow-hidden relative",
          imageCount === 2 && "grid-cols-2",
          imageCount === 3 && "grid-cols-2",
          imageCount >= 4 && "grid-cols-2"
        )}
        style={{ maxWidth: "400px" }}
      >
        {media.slice(0, 4).map((image, index) => (
          <div
            key={index}
            className={cn(
              "relative overflow-hidden group aspect-square",
              !isPreview && "cursor-pointer",
              imageCount === 3 && index === 0 && "col-span-2"
            )}
            onClick={() => handleImageClick(index)}
          >
            <img
              src={image.thumbnail || image.url}
              alt={`Shared image ${index + 1}`}
              className={cn(
                "w-full h-full object-cover",
                !isPreview && "transition-transform group-hover:scale-105"
              )}
            />

            {!isPreview && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            )}

            {/* Show count if more than 4 images */}
            {index === 3 && imageCount > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{imageCount - 4}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Uploading overlay for multiple images */}
        {isPreview && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <span className="text-white text-sm font-medium">กำลังส่ง...</span>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {!isPreview && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={slides}
          index={selectedIndex}
        />
      )}
    </>
  );
}
