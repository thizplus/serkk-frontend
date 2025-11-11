import { cn } from "@/lib/utils";

interface OnlineStatusProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
  className?: string;
}

export function OnlineStatus({
  isOnline,
  size = "md",
  showDot = true,
  className,
}: OnlineStatusProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  if (!showDot) return null;

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background",
        sizeClasses[size],
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
      aria-label={isOnline ? "ออนไลน์" : "ออฟไลน์"}
    />
  );
}
