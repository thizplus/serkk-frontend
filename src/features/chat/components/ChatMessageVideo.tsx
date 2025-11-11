"use client";

import type { MessageMedia } from "@/shared/lib/data/mockChats";
import type { ChatMessageMedia } from "@/shared/types/models";
import { Loader2 } from "@/shared/config/icons";

interface ChatMessageVideoProps {
  media: MessageMedia[] | ChatMessageMedia[];
  isOwnMessage: boolean;
}

export function ChatMessageVideo({ media, isOwnMessage }: ChatMessageVideoProps) {
  const video = media[0]; // Videos usually sent one at a time

  // Safety check: if no video, return null
  if (!video) {
    console.warn('ChatMessageVideo: No video found in media array');
    return null;
  }

  // Check if uploading (preview URL starts with blob:)
  const isUploading = video.url?.startsWith('blob:') ?? false;

  // With R2, videos play immediately - no encoding delay
  return (
    <div className="relative max-w-sm rounded-lg overflow-hidden bg-muted">
      <video
        src={video.url}
        poster={'thumbnail' in video ? video.thumbnail || undefined : undefined}
        controls={!isUploading}
        className="w-full h-auto"
        style={{ minHeight: '150px' }}
      />

      {/* ✅ Loading Overlay - แสดงตอนกำลังอัปโหลด */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
          <p className="text-white text-sm font-medium">กำลังอัปโหลด...</p>
        </div>
      )}
    </div>
  );
}
