"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

// Emoji categories สำหรับ Phase 1 (พื้นฐาน)
const EMOJI_CATEGORIES = {
  smileys: {
    label: "😊 สีหน้า",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
    ],
  },
  gestures: {
    label: "👋 ท่าทาง",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐",
      "🖖", "👋", "🤝", "🙏", "💪", "🦾", "🤲", "🙌",
    ],
  },
  hearts: {
    label: "❤️ หัวใจ",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗",
    ],
  },
  objects: {
    label: "🎉 สิ่งของ",
    emojis: [
      "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁",
      "⭐", "✨", "💫", "🌟", "☀️", "🌙", "⚡", "🔥",
    ],
  },
};

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute bottom-1.5 right-1.5 h-7 w-7",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            "rounded-lg transition-colors"
          )}
          disabled={disabled}
          title="อิโมจิ"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        side="top"
        sideOffset={8}
      >
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <div key={key} className="p-3 border-b last:border-b-0">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                {category.label}
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map((emoji, index) => (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={cn(
                      "aspect-square flex items-center justify-center",
                      "text-2xl rounded-md",
                      "hover:bg-accent transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
