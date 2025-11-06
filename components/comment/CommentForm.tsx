"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { useUser } from "@/lib/stores/authStore";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyToUsername?: string;
  onSubmit: (content: string, parentId?: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  replyToUsername,
  onSubmit,
  onCancel,
  placeholder = "แสดงความคิดเห็น...",
  autoFocus = false,
}: CommentFormProps) {
  const currentUser = useUser();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim(), parentId);
      setContent("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Reply indicator */}
      {replyToUsername && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>ตอบกลับ</span>
          <span className="font-medium text-foreground">@{replyToUsername}</span>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Comment input */}
      <div className="flex gap-3">
        {/* User avatar */}
        <div className="shrink-0">
          <Image
            src={currentUser?.avatar || "/logo.png"}
            alt={currentUser?.displayName || "Your avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>

        {/* Textarea */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
          />

          {/* Action buttons */}
          <div className="flex gap-2 mt-2 justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                "กำลังส่ง..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {parentId ? "ตอบกลับ" : "แสดงความคิดเห็น"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
