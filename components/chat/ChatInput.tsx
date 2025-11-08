"use client";

import { useState, useRef, useEffect, useCallback, memo, KeyboardEvent, ChangeEvent } from "react";
import { Send, Paperclip, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./EmojiPicker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SelectedFile {
  file: File;
  preview: string;
  type: "image" | "video" | "file";
}

interface ChatInputProps {
  onSendMessage: (message: string, files?: SelectedFile[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChatInputComponent({
  onSendMessage,
  disabled = false,
  placeholder = "ข้อความ",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [shouldFocus, setShouldFocus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, []); // Empty deps = run once on mount

  // Re-focus after sending (when disabled changes from true to false)
  useEffect(() => {
    if (!disabled && shouldFocus && textareaRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        setShouldFocus(false);
      });
    }
  }, [disabled, shouldFocus]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    const hasContent = trimmedMessage || selectedFiles.length > 0;

    if (hasContent && !disabled) {
      onSendMessage(trimmedMessage, selectedFiles.length > 0 ? selectedFiles : undefined);
      setMessage("");
      setSelectedFiles([]);

      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // ✅ Trigger focus after parent re-renders
      setShouldFocus(true);
    }
  }, [message, selectedFiles, disabled, onSendMessage]);

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = message;

    // Insert emoji at cursor position
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setMessage(newText);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }, [message]);

  // File handling
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SelectedFile[] = [];
    const maxFiles = type === "image" ? 10 : 5;

    // Check total count
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`เลือกได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    Array.from(files).forEach((file) => {
      // Validate file type
      if (type === "image") {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพหรือวิดีโอ`);
          return;
        }
        // Check if already has video and trying to add image or vice versa
        const hasVideo = selectedFiles.some((f) => f.type === "video");
        const isVideo = file.type.startsWith("video/");
        if ((hasVideo && !isVideo) || (!hasVideo && isVideo && selectedFiles.length > 0)) {
          toast.error("ไม่สามารถส่งรูปภาพและวิดีโอพร้อมกันได้");
          return;
        }
        // Video limit: 1 only
        if (isVideo && (selectedFiles.length > 0 || files.length > 1)) {
          toast.error("ส่งได้ทีละ 1 วิดีโอเท่านั้น");
          return;
        }
        // Max size
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
        if (file.size > maxSize) {
          toast.error(`${file.name} ขนาดเกิน ${isVideo ? "100MB" : "10MB"}`);
          return;
        }
      } else {
        // File type
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          toast.error(`${file.name} ขนาดเกิน 50MB`);
          return;
        }
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const fileType: "image" | "video" | "file" =
        file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "file";

      newFiles.push({
        file,
        preview,
        type: fileType,
      });
    });

    setSelectedFiles([...selectedFiles, ...newFiles]);

    // Reset input
    e.target.value = "";
  }, [selectedFiles]);

  const removeFile = useCallback((index: number) => {
    const file = selectedFiles[index];
    URL.revokeObjectURL(file.preview); // Clean up preview URL
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  }, [selectedFiles]);

  const hasMessage = message.trim().length > 0 || selectedFiles.length > 0;

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="p-3 pb-0">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border bg-muted"
                style={{ width: "80px", height: "80px" }}
              >
                {/* Preview */}
                {file.type === "image" ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type === "video" ? (
                  <video
                    src={file.preview}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-xs">
                    <Paperclip className="h-6 w-6 mb-1" />
                    <span className="truncate w-full text-center">
                      {file.file.name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        {/* File Upload Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {/* Image/Video Upload */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            title="แนบรูปภาพหรือวิดีโอ"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />

          {/* File Upload */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="แนบไฟล์"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "file")}
          />
        </div>

        {/* Text Input Container */}
        <div className="flex-1 relative min-h-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border bg-background",
              "px-4 py-2 pr-12 block",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[120px] overflow-y-auto",
              "transition-shadow duration-200"
            )}
            style={{
              minHeight: "40px",
              lineHeight: "1.5",
            }}
          />

          {/* Emoji Picker - Fixed at bottom right */}
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            disabled={disabled}
          />
        </div>

        {/* Send Button - Fixed at bottom */}
        <Button
          onClick={handleSend}
          disabled={disabled || !hasMessage}
          size="icon"
          className={cn(
            "h-10 w-10 flex-shrink-0 rounded-full transition-all duration-200",
            hasMessage
              ? "bg-primary hover:bg-primary/90 scale-100 shadow-sm"
              : "bg-muted text-muted-foreground scale-95 opacity-70"
          )}
          title="ส่งข้อความ"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ✅ Memoize component เพื่อป้องกัน unnecessary re-renders
export const ChatInput = memo(ChatInputComponent);
