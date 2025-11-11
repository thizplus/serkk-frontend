"use client";

import { useState, useRef } from "react";
import { X, ImageIcon, Upload, Video, Loader2 } from "@/shared/config/icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { FORM_LIMITS } from "@/shared/config";
import { toast } from "sonner";
import mediaService from "@/shared/lib/api/media.service";
import type { Post, Media } from "@/shared/types/models";
import { useOptimisticPost } from "@/features/posts/hooks/useOptimisticPost";
import { MediaGrid } from "@/shared/components/media/MediaGrid";
import { uploadMultipleFiles } from "@/shared/lib/upload/concurrentUpload";
import type { UploadProgress } from "@/shared/lib/upload/types";

interface UploadedMedia {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail?: string | null;
  fileName: string;
  size: number;
  // No encoding fields needed - R2 videos play immediately
}

interface CreatePostFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    tags?: string[];
    mediaIds?: string[];  // Uploaded media IDs from R2
    media?: File[];  // Backward compatibility (deprecated)
  }) => void;
  onCancel?: () => void;
  sourcePost?: Post;
  isSubmitting?: boolean;
  initialTags?: string[];
  autoUploadMedia?: boolean;  // Auto-upload files immediately (default: true)
  enableOptimisticUI?: boolean;  // Enable optimistic UI (background upload after post)
}

export function CreatePostForm({
  onSubmit,
  onCancel,
  sourcePost,
  isSubmitting = false,
  initialTags = [],
  autoUploadMedia = true,  // ✅ ใช้ R2 auto-upload mode
  enableOptimisticUI = false,  // ✅ Optimistic UI mode
}: CreatePostFormProps) {
  // ✅ ใช้ custom hook สำหรับ optimistic post
  const { createOptimisticPost } = useOptimisticPost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");

  // Old state (for backward compatibility when autoUploadMedia = false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  // New state (for auto-upload mode)
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{[fileName: string]: number}>({});
  const [uploadPromises, setUploadPromises] = useState<{[fileName: string]: Promise<any>}>({});

  // ✅ Batch upload state (overall progress)
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Optimistic UI state (hold files with blob URLs, upload later)
  const [optimisticMediaFiles, setOptimisticMediaFiles] = useState<{
    file: File;
    preview: string;
  }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || isSubmitting) {
      return;
    }

    try {
      // ✅ OPTIMISTIC UI MODE: ใช้ custom hook
      if (enableOptimisticUI) {
        // Case 1: With media - use optimistic flow
        if (optimisticMediaFiles.length > 0) {
          await createOptimisticPost({
            title: title.trim(),
            content: content.trim(),
            tags,
            mediaFiles: optimisticMediaFiles,
          });

          // Reset form
          setTitle('');
          setContent('');
          setTags([]);
          setOptimisticMediaFiles([]);
          return;
        } else {
          // Case 2: No media - just create post normally (no optimistic needed)
          await onSubmit({
            title: title.trim(),
            content: content.trim(),
            tags: tags.length > 0 ? tags : undefined,
            mediaIds: undefined,
          });
          return;
        }
      }

      // ✅ AUTO UPLOAD MODE: Wait for uploads → Create post
      if (autoUploadMedia) {
        const pendingUploads = Object.values(uploadPromises);

        if (pendingUploads.length > 0) {
          toast.info('กำลังอัปโหลดและสร้างโพสต์...', { duration: Infinity, id: 'uploading-post' });

          try {
            await Promise.all(pendingUploads);
            toast.dismiss('uploading-post');

            // Clear upload promises
            setUploadPromises({});
          } catch (error) {
            console.error('❌ Upload ล้มเหลว:', error);
            toast.dismiss('uploading-post');
            toast.error('อัปโหลดไฟล์ล้มเหลว กรุณาลองใหม่อีกครั้ง');
            return;
          }
        }

        // Use uploaded media (already added by onComplete callback)
        const mediaIds = uploadedMedia.map(m => m.id);

        await onSubmit({
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        });
      } else {
        // Old mode: send media files (backward compatibility)
        await onSubmit({
          title: title.trim(),
          content: content.trim(),
          tags: tags.length > 0 ? tags : undefined,
          media: mediaFiles.length > 0 ? mediaFiles : undefined,
        });
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Filter only images and videos
    const validFiles = files.filter(file => {
      return file.type.startsWith('image/') || file.type.startsWith('video/');
    });

    if (validFiles.length === 0) {
      toast.error('กรุณาเลือกไฟล์รูปภาพหรือวิดีโอเท่านั้น');
      return;
    }

    // ✅ OPTIMISTIC UI MODE: Just create blob URLs, upload later (DON'T auto-upload)
    if (enableOptimisticUI) {
      const currentCount = optimisticMediaFiles.length;
      const maxNewFiles = Math.min(validFiles.length, FORM_LIMITS.MEDIA.MAX_FILES - currentCount);

      if (maxNewFiles === 0) {
        toast.error(`คุณเลือกไฟล์ครบ ${FORM_LIMITS.MEDIA.MAX_FILES} ไฟล์แล้ว`);
        return;
      }

      const filesToAdd = validFiles.slice(0, maxNewFiles);
      const newMediaFiles = filesToAdd.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setOptimisticMediaFiles(prev => [...prev, ...newMediaFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return; // ⚠️ Exit early - don't run auto-upload code below
    }

    // ✅ AUTO UPLOAD MODE: Upload files immediately using batch upload (only if NOT in optimistic UI mode)
    if (autoUploadMedia && !enableOptimisticUI) {
      // New mode: upload files immediately with batch API
      const currentMediaCount = uploadedMedia.length;
      const maxNewFiles = Math.min(validFiles.length, FORM_LIMITS.MEDIA.MAX_FILES - currentMediaCount);

      if (maxNewFiles === 0) {
        toast.error(`คุณอัปโหลดไฟล์ครบ ${FORM_LIMITS.MEDIA.MAX_FILES} ไฟล์แล้ว`);
        return;
      }

      const filesToUpload = validFiles.slice(0, maxNewFiles);

      // ✅ Upload using batch API with overall progress tracking
      setIsUploading(true);
      setOverallProgress(0);

      const uploadPromise = (async () => {
        try {
          const result = await uploadMultipleFiles(filesToUpload, {
            concurrency: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
            onProgress: (progress: UploadProgress) => {
              // ✅ Update overall progress (not per-file!)
              setOverallProgress(progress.progress);
            },
            onComplete: (results: UploadProgress[]) => {
              // Get successful uploads
              const successfulUploads = results.filter(r => r.status === 'completed');

              // Add to uploaded media list
              const newMedia: UploadedMedia[] = successfulUploads.map(r => {
                const file = filesToUpload[r.fileIndex];
                // ✅ เช็ค type จาก File object ไม่ใช่ fileName!
                const isVideo = file.type.startsWith('video/');

                return {
                  id: r.mediaId || '',
                  type: isVideo ? 'video' : 'image',
                  url: r.url || '',
                  thumbnail: null,
                  fileName: r.fileName,
                  size: file.size,
                };
              });

              setUploadedMedia(prev => [...prev, ...newMedia]);

              // Show success message
              toast.success(`อัปโหลดสำเร็จ ${successfulUploads.length}/${results.length} ไฟล์`);

              // Reset upload state
              setIsUploading(false);
              setOverallProgress(0);
            },
            onError: (error: Error, fileIndex: number) => {
              console.error(`Upload failed for file ${fileIndex}:`, error);
              toast.error(`อัปโหลดล้มเหลว: ${error.message}`);
            },
          });

          return result;
        } catch (error) {
          console.error('Batch upload failed:', error);
          toast.error(`อัปโหลดล้มเหลว: ${error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'}`);
          setIsUploading(false);
          setOverallProgress(0);
          throw error;
        }
      })();

      // เก็บ promise ไว้สำหรับ handleSubmit
      setUploadPromises(prev => ({ ...prev, 'batch-upload': uploadPromise }));

    } else {
      // Old mode: just create previews (backward compatibility)
      const newFiles = [...mediaFiles, ...validFiles].slice(0, FORM_LIMITS.MEDIA.MAX_FILES);
      setMediaFiles(newFiles);

      // Create previews
      const newPreviews: string[] = [];
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === newFiles.length) {
            setMediaPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    if (enableOptimisticUI) {
      // Optimistic UI mode: remove from optimistic media files
      const removedMedia = optimisticMediaFiles[index];

      // Revoke blob URL to free memory
      URL.revokeObjectURL(removedMedia.preview);

      setOptimisticMediaFiles(prev => prev.filter((_, i) => i !== index));
      toast.success(`ลบ ${removedMedia.file.name} แล้ว`);
    } else if (autoUploadMedia) {
      // Remove from uploaded media list
      const removedMedia = uploadedMedia[index];
      setUploadedMedia(prev => prev.filter((_, i) => i !== index));

      // Optionally: call API to delete media from server
      // await mediaService.delete(removedMedia.id);

      toast.success(`ลบ ${removedMedia.fileName} แล้ว`);
    } else {
      // Old mode: remove from local files
      const newFiles = mediaFiles.filter((_, i) => i !== index);
      const newPreviews = mediaPreviews.filter((_, i) => i !== index);
      setMediaFiles(newFiles);
      setMediaPreviews(newPreviews);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');

      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Component for rendering uploaded media (simplified for R2)
  const MediaPreviewCard = ({ media, index }: { media: UploadedMedia; index: number }) => {
    const isVideo = media.type === 'video';

    return (
      <div key={media.id} className="relative group aspect-video bg-muted rounded-lg overflow-hidden">
        {isVideo ? (
          // Show video player (plays immediately with R2)
          <video
            src={media.url}
            poster={media.thumbnail || undefined}
            className="w-full h-full object-cover"
            controls
          />
        ) : (
          // Image preview
          <Image
            src={media.url}
            alt={media.fileName}
            fill
            className="object-cover"
          />
        )}

        {/* Remove button */}
        <button
          type="button"
          onClick={() => handleRemoveMedia(index)}
          className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>

        {/* File info badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
          {isVideo ? <Video size={12} /> : <ImageIcon size={12} />}
          <span>{(media.size / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sourcePost ? "โพสต์ข้าม" : "สร้างโพสต์ใหม่"}</CardTitle>
        <CardDescription>
          {sourcePost
            ? "แชร์โพสต์นี้พร้อมเพิ่มความคิดเห็นของคุณเอง"
            : "แบ่งปันเรื่องราวหรือความคิดของคุณกับชุมชน"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Post Preview */}
          {sourcePost && (
            <div className="mb-6">
              <FieldLabel>โพสต์ต้นฉบับ</FieldLabel>
              <Card className="mt-2 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {sourcePost.author.avatar && (
                      <Image
                        src={sourcePost.author.avatar}
                        alt={sourcePost.author.displayName}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {sourcePost.author.displayName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      @{sourcePost.author.username}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{sourcePost.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {sourcePost.content}
                  </p>
                  {sourcePost.media && sourcePost.media.length > 0 && (
                    <div className="mt-3 relative h-48 rounded-lg overflow-hidden bg-muted">
                      {sourcePost.media[0].type === "video" ? (
                        <video
                          src={sourcePost.media[0].url}
                          className="w-full h-full object-cover"
                          poster={sourcePost.media[0].thumbnail || undefined}
                        />
                      ) : (
                        <Image
                          src={sourcePost.media[0].url}
                          alt="Post media"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {/* Title */}
          <Field>
            <FieldLabel htmlFor="title">หัวข้อ *</FieldLabel>
            <Input
              id="title"
              type="text"
              placeholder="หัวข้อโพสต์ของคุณ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={FORM_LIMITS.POST.TITLE_MAX}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/{FORM_LIMITS.POST.TITLE_MAX} ตัวอักษร
            </p>
          </Field>

          {/* Content */}
          <Field>
            <FieldLabel htmlFor="content">เนื้อหา *</FieldLabel>
            <textarea
              id="content"
              placeholder="เขียนเนื้อหาของคุณที่นี่..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              รองรับการขึ้นบรรทัดใหม่
            </p>
          </Field>

          {/* Tags */}
          <Field>
            <FieldLabel htmlFor="tags">แท็ก (ไม่บังคับ)</FieldLabel>
            <Input
              id="tags"
              type="text"
              placeholder="พิมพ์แท็กแล้วกด Enter หรือเครื่องหมาย comma"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* Upload Media - ซ่อนตอน crosspost */}
          {!sourcePost && (
            <Field>
              <FieldLabel>รูปภาพ/วิดีโอ (ไม่บังคับ)</FieldLabel>

              {/* Preview Grid - Optimistic UI Mode */}
              {enableOptimisticUI && optimisticMediaFiles.length > 0 && (
                <div className="mb-3">
                  <MediaGrid
                    media={optimisticMediaFiles.map((m, index) => ({
                      id: `preview-${index}`,
                      url: m.preview,
                      type: m.file.type.startsWith('video/') ? 'video' : 'image',
                    }))}
                    maxDisplay={FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY}
                    onRemove={handleRemoveMedia}
                    editable
                  />
                  {optimisticMediaFiles.length > FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY && (
                    <p className="text-xs text-muted-foreground mt-2">
                      แสดง {FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY} ไฟล์แรก จากทั้งหมด {optimisticMediaFiles.length} ไฟล์
                    </p>
                  )}
                </div>
              )}

              {/* Preview Grid - Auto Upload Mode */}
              {autoUploadMedia && !enableOptimisticUI && uploadedMedia.length > 0 && (
                <div className="mb-3">
                  <MediaGrid
                    media={uploadedMedia.map((m) => {
                      // ✅ Fallback: เช็คจาก URL extension ถ้า m.type อาจผิด
                      const urlLower = m.url.toLowerCase();
                      const isVideoByUrl = /\.(mp4|webm|mov|avi)$/i.test(urlLower);
                      const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlLower);

                      let type: 'image' | 'video' = m.type === 'video' ? 'video' : 'image';

                      // Override ด้วย URL extension (เพราะอาจมี bug ใน type detection)
                      if (isVideoByUrl) {
                        type = 'video';
                      } else if (isImageByUrl) {
                        type = 'image';
                      }

                      return {
                        id: m.id,
                        url: m.url,
                        type,
                        thumbnail: m.thumbnail || undefined,
                      };
                    })}
                    maxDisplay={FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY}
                    onRemove={handleRemoveMedia}
                    editable
                  />
                  {uploadedMedia.length > FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY && (
                    <p className="text-xs text-muted-foreground mt-2">
                      แสดง {FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY} ไฟล์แรก จากทั้งหมด {uploadedMedia.length} ไฟล์
                    </p>
                  )}
                </div>
              )}

              {/* Preview Grid - Old Mode (Backward Compatibility) */}
              {!autoUploadMedia && mediaPreviews.length > 0 && (
                <div className="mb-3">
                  <MediaGrid
                    media={mediaPreviews.map((preview, index) => ({
                      id: `old-preview-${index}`,
                      url: preview,
                      type: mediaFiles[index].type.startsWith('video/') ? 'video' : 'image',
                    }))}
                    maxDisplay={FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY}
                    onRemove={handleRemoveMedia}
                    editable
                  />
                  {mediaPreviews.length > FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY && (
                    <p className="text-xs text-muted-foreground mt-2">
                      แสดง {FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY} ไฟล์แรก จากทั้งหมด {mediaPreviews.length} ไฟล์
                    </p>
                  )}
                </div>
              )}

              {/* Show overall upload progress */}
              {autoUploadMedia && isUploading && (
                <div className="mb-3 space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate flex-1 mr-2">กำลังอัปโหลด...</span>
                      <span className="font-medium">{overallProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Buttons - Facebook Style */}
              {((enableOptimisticUI ? optimisticMediaFiles.length : autoUploadMedia ? uploadedMedia.length : mediaFiles.length)) < FORM_LIMITS.MEDIA.MAX_FILES && (
                <div>
                 
                  <div className="flex gap-2">
                    {/* Photo Button - Single Image */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    

                    {/* Gallery Button - Multiple Images (Future) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!enableOptimisticUI && isUploading}
                      className="block border border-border items-center cursor-pointer  justify-center gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-5 w-5 m-auto" />
                      <span className="text-sm font-medium">แกลเลอรี่</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    รองรับไฟล์รูปภาพและวิดีโอ (สูงสุด {FORM_LIMITS.MEDIA.MAX_FILES} ไฟล์)
                  </p>
                </div>
              )}

              {((enableOptimisticUI ? optimisticMediaFiles.length : autoUploadMedia ? uploadedMedia.length : mediaFiles.length)) >= FORM_LIMITS.MEDIA.MAX_FILES && (
                <p className="text-xs text-muted-foreground">
                  คุณเลือกไฟล์ครบ {FORM_LIMITS.MEDIA.MAX_FILES} ไฟล์แล้ว (สูงสุด)
                </p>
              )}
            </Field>
          )}


          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting || (!enableOptimisticUI && isUploading)}
              className="flex-1"
            >
              {isSubmitting ? (
                "กำลังสร้างโพสต์..."
              ) : (!enableOptimisticUI && isUploading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังอัปโหลด... {overallProgress}%
                </>
              ) : (
                "โพสต์"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
