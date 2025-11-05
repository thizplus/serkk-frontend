"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, Upload, Video } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Post } from "@/lib/types/models";

interface CreatePostFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    tags?: string[];
    media?: File[];
  }) => void;
  onCancel?: () => void;
  sourcePost?: Post;
  isSubmitting?: boolean;
  uploadProgress?: number;
}

export function CreatePostForm({
  onSubmit,
  onCancel,
  sourcePost,
  isSubmitting = false,
  uploadProgress = 0,
}: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || isSubmitting) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags: tags.length > 0 ? tags : undefined,
      media: mediaFiles.length > 0 ? mediaFiles : undefined,
    });

    // Note: Form reset is not needed as user will be navigated away
    // Navigation is handled by the parent component (create-post page)
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Filter only images and videos
    const validFiles = files.filter(file => {
      return file.type.startsWith('image/') || file.type.startsWith('video/');
    });

    // Limit to 4 files
    const newFiles = [...mediaFiles, ...validFiles].slice(0, 4);
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
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
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/300 ตัวอักษร
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

              {/* Preview Grid */}
              {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {mediaPreviews.map((preview, index) => {
                  const file = mediaFiles[index];
                  const isVideo = file.type.startsWith('video/');

                  return (
                    <div key={index} className="relative group aspect-video bg-muted rounded-lg overflow-hidden">
                      {isVideo ? (
                        <video
                          src={preview}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {isVideo ? <Video size={12} className="inline mr-1" /> : <ImageIcon size={12} className="inline mr-1" />}
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload Button */}
            {mediaFiles.length < 4 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    คลิกเพื่ออัปโหลดรูปภาพหรือวิดีโอ
                  </p>
                  <p className="text-xs text-muted-foreground">
                    รองรับไฟล์ภาพและวิดีโอ (สูงสุด 4 ไฟล์)
                  </p>
                </button>
              </div>
            )}

            {mediaFiles.length >= 4 && (
              <p className="text-xs text-muted-foreground">
                คุณอัปโหลดไฟล์ครบ 4 ไฟล์แล้ว (สูงสุด)
              </p>
            )}
            </Field>
          )}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">กำลังอัปโหลดไฟล์...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? uploadProgress > 0
                  ? `กำลังอัปโหลด... ${uploadProgress}%`
                  : "กำลังโพสต์..."
                : "โพสต์"}
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
