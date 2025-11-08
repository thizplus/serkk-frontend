"use client";

import { HLSVideoPlayer } from "@/components/common/HLSVideoPlayer";
import type { MessageMedia } from "@/lib/data/mockChats";
import type { ChatMessageMedia } from "@/lib/types/models";

interface ChatMessageVideoProps {
  media: MessageMedia[] | ChatMessageMedia[];
  isOwnMessage: boolean;
}

export function ChatMessageVideo({ media, isOwnMessage }: ChatMessageVideoProps) {
  const video = media[0]; // Videos usually sent one at a time

  // Check if uploading (preview URL starts with blob:)
  const isPreview = video.url.startsWith('blob:');

  // ถ้ามี hlsUrl หรือ url เป็น .m3u8 แสดงว่าพร้อมใช้งานแล้ว (แม้ encodingStatus จะเป็น pending)
  const hlsUrl = 'hlsUrl' in video ? video.hlsUrl : undefined;
  const isVideoReady = !isPreview && (hlsUrl || video.url.includes('.m3u8'));
  const effectiveEncodingStatus = isVideoReady
    ? 'completed'
    : isPreview
    ? 'processing' // Show uploading state for preview
    : ('encodingStatus' in video ? video.encodingStatus : 'completed');

  return (
    <div className="max-w-sm rounded-lg overflow-hidden">
      <HLSVideoPlayer
        hlsUrl={hlsUrl}
        fallbackUrl={isPreview ? undefined : video.url}
        thumbnail={'thumbnail' in video ? video.thumbnail || undefined : video.url}
        encodingStatus={effectiveEncodingStatus}
        encodingProgress={isPreview ? 0 : ('encodingProgress' in video ? video.encodingProgress : 100)}
        controls={!isPreview}
        className="w-full h-auto"
      />
    </div>
  );
}
