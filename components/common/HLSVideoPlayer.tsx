"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Loader2, AlertCircle } from "lucide-react";
import type { EncodingStatus } from "@/lib/types/common";

// ============================================================================
// TYPES
// ============================================================================

export interface HLSVideoPlayerProps {
  /**
   * HLS playlist URL (.m3u8)
   */
  hlsUrl?: string;

  /**
   * Fallback direct video URL (MP4) - ใช้ถ้า HLS ไม่พร้อม
   */
  fallbackUrl?: string;

  /**
   * Thumbnail/poster image URL
   */
  thumbnail?: string;

  /**
   * Video encoding status
   */
  encodingStatus?: EncodingStatus;

  /**
   * Video encoding progress (0-100)
   */
  encodingProgress?: number;

  /**
   * CSS class สำหรับ container
   */
  className?: string;

  /**
   * Show controls
   */
  controls?: boolean;

  /**
   * Auto play
   */
  autoPlay?: boolean;

  /**
   * Muted
   */
  muted?: boolean;

  /**
   * Video width
   */
  width?: string | number;

  /**
   * Video height
   */
  height?: string | number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * HLS Video Player Component
 * รองรับ adaptive bitrate streaming ผ่าน Bunny Stream
 */
export function HLSVideoPlayer({
  hlsUrl,
  fallbackUrl,
  thumbnail,
  encodingStatus = "completed",
  encodingProgress = 100,
  className = "",
  controls = true,
  autoPlay = false,
  muted = false,
  width = "100%",
  height = "auto",
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Setup HLS player
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // ถ้ายัง encode ไม่เสร็จ ไม่ต้อง setup player
    if (encodingStatus !== "completed" && encodingStatus !== "failed") {
      return;
    }

    // ถ้าไม่มี HLS URL ใช้ fallback
    if (!hlsUrl) {
      if (fallbackUrl) {
        video.src = fallbackUrl;
      }
      return;
    }

    // ถ้า browser รองรับ HLS แบบ native (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return;
    }

    // ถ้า browser ไม่รองรับ HLS แต่รองรับ HLS.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch((err) => {
            console.error("Auto-play failed:", err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("ไม่สามารถโหลดวิดีโอได้ กรุณาลองใหม่อีกครั้ง");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("เกิดข้อผิดพลาดในการเล่นวิดีโอ");
              hls.recoverMediaError();
              break;
            default:
              setError("ไม่สามารถเล่นวิดีโอได้");
              hls.destroy();
              break;
          }
        }
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHlsInstance(hls);

      // Cleanup
      return () => {
        hls.destroy();
      };
    } else {
      // Browser ไม่รองรับ HLS - ใช้ fallback
      if (fallbackUrl) {
        video.src = fallbackUrl;
      } else {
        setError("เบราว์เซอร์ของคุณไม่รองรับรูปแบบวิดีโอนี้");
      }
    }
  }, [hlsUrl, fallbackUrl, autoPlay, encodingStatus]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render encoding status overlay
   */
  const renderEncodingOverlay = () => {
    if (encodingStatus === "completed") return null;

    // Check if this is uploading (fallbackUrl is undefined and thumbnail is blob:)
    const isUploading = !fallbackUrl && thumbnail?.startsWith('blob:');

    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10">
        {encodingStatus === "pending" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg font-medium">กำลังประมวลผลวิดีโอ...</p>
            <p className="text-sm text-gray-300 mt-2">กรุณารอสักครู่</p>
          </>
        )}

        {encodingStatus === "processing" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg font-medium">
              {isUploading ? 'กำลังอัปโหลดวิดีโอ...' : 'กำลังประมวลผลวิดีโอ...'}
            </p>
            {encodingProgress > 0 && (
              <>
                <div className="w-64 bg-gray-700 rounded-full h-2 mt-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${encodingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-300 mt-2">{encodingProgress}%</p>
              </>
            )}
            {encodingProgress === 0 && (
              <p className="text-sm text-gray-300 mt-2">กรุณารอสักครู่</p>
            )}
          </>
        )}

        {encodingStatus === "failed" && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">ประมวลผลวิดีโอล้มเหลว</p>
            <p className="text-sm text-gray-300 mt-2">กรุณาลองอัปโหลดใหม่อีกครั้ง</p>
          </>
        )}
      </div>
    );
  };

  /**
   * Render error overlay
   */
  const renderErrorOverlay = () => {
    if (!error) return null;

    return (
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <video
        ref={videoRef}
        className="w-full h-full rounded-lg bg-black"
        controls={controls && encodingStatus === "completed"}
        poster={thumbnail || undefined}
        muted={muted}
        playsInline
        preload="metadata"
      />

      {renderEncodingOverlay()}
      {renderErrorOverlay()}

      {isLoading && encodingStatus === "completed" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HLSVideoPlayer;
