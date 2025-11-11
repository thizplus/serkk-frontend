"use client";

import { FileText, Download, FileArchive, FileSpreadsheet, FileCode, AlertCircle } from "@/shared/config/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MessageMedia } from "@/shared/lib/data/mockChats";
import type { ChatMessageMedia } from "@/shared/types/models";

interface ChatMessageFileProps {
  media: MessageMedia[] | ChatMessageMedia[];
  isOwnMessage: boolean;
}

export function ChatMessageFile({ media, isOwnMessage }: ChatMessageFileProps) {
  // Validate media array
  if (!media || media.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 max-w-xs">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm text-destructive">ไม่พบไฟล์</span>
      </div>
    );
  }

  const file = media[0]; // Files usually sent one at a time

  // Validate file data
  if (!file || !file.url) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 max-w-xs">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm text-destructive">ข้อมูลไฟล์ไม่ครบถ้วน</span>
      </div>
    );
  }

  // Format file size (bytes to human readable)
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "ไม่ทราบขนาด";
    if (bytes === 0) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    // Prevent index out of range
    const sizeIndex = Math.min(i, sizes.length - 1);
    const formattedSize = (bytes / Math.pow(1024, sizeIndex)).toFixed(1);

    return `${formattedSize} ${sizes[sizeIndex]}`;
  };

  // Render file icon based on MIME type
  const renderFileIcon = (mimeType?: string) => {
    const iconClass = "h-8 w-8";

    if (!mimeType) return <FileText className={iconClass} />;

    if (mimeType.includes("pdf")) return <FileText className={iconClass} />;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive"))
      return <FileArchive className={iconClass} />;
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
      return <FileSpreadsheet className={iconClass} />;
    if (mimeType.includes("code") || mimeType.includes("javascript") || mimeType.includes("typescript"))
      return <FileCode className={iconClass} />;

    return <FileText className={iconClass} />;
  };

  // Get file color based on MIME type
  const getFileColor = (mimeType?: string) => {
    if (!mimeType) return "text-muted-foreground";

    if (mimeType.includes("pdf")) return "text-red-500";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "text-yellow-500";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "text-green-500";
    if (mimeType.includes("word") || mimeType.includes("document")) return "text-blue-500";

    return "text-muted-foreground";
  };

  // Get file extension from filename or mimeType
  const getFileExtension = () => {
    if (file.filename) {
      const parts = file.filename.split(".");
      if (parts.length > 1) {
        return parts.pop()?.toUpperCase() || "FILE";
      }
    }

    // Fallback to mime type
    if (file.mimeType) {
      const mimeMap: Record<string, string> = {
        "application/pdf": "PDF",
        "application/msword": "DOC",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
        "application/vnd.ms-excel": "XLS",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
        "application/zip": "ZIP",
        "application/x-rar-compressed": "RAR",
        "text/plain": "TXT",
      };
      return mimeMap[file.mimeType] || "FILE";
    }

    return "FILE";
  };

  const iconColor = getFileColor(file.mimeType);
  const fileExtension = getFileExtension();

  const handleDownload = () => {
    try {
      // Validate URL
      if (!file.url || file.url === "#") {
        toast.error("ไม่สามารถดาวน์โหลดไฟล์ได้ (URL ไม่ถูกต้อง)");
        return;
      }

      // For mock/preview URLs (blob:), show message
      if (file.url.startsWith("blob:")) {
        toast.info("นี่คือไฟล์ตัวอย่าง (Mock) ในโหมด Production จะดาวน์โหลดไฟล์จริง");
        console.log("Mock download:", file.filename);
        return;
      }

      // In production, this would trigger actual file download
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.filename || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("เริ่มดาวน์โหลดไฟล์แล้ว");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border max-w-xs",
        isOwnMessage
          ? "bg-primary/10 border-primary/20"
          : "bg-muted border-border"
      )}
    >
      {/* File Icon */}
      <div className={cn("shrink-0", iconColor)}>
        {renderFileIcon(file.mimeType)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={file.filename || "ไม่ทราบชื่อไฟล์"}>
          {file.filename || `ไฟล์ ${fileExtension}`}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{fileExtension}</span>
          <span>•</span>
          <span>{formatFileSize(file.size)}</span>
        </div>
      </div>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={handleDownload}
        disabled={!file.url || file.url === "#"}
        title={
          !file.url || file.url === "#"
            ? "ไม่สามารถดาวน์โหลดได้"
            : "ดาวน์โหลด"
        }
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
