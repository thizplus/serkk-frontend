"use client";

import { useRouter } from "next/navigation";
import { Share2, Link2, Facebook, MessageCircle, Repeat2 } from "@/shared/config/icons";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TOAST_MESSAGES } from "@/shared/config";

interface ShareDropdownProps {
  postId: string;
  postTitle: string;
}

export function ShareDropdown({ postId, postTitle }: ShareDropdownProps) {
  const router = useRouter();
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/post/${postId}`
    : '';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(TOAST_MESSAGES.GENERAL.COPY_SUCCESS);
      } else {
        prompt('คัดลอกลิงก์นี้:', url);
      }
    } catch (error) {
      toast.error(TOAST_MESSAGES.GENERAL.COPY_ERROR);
    }
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(postTitle)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleShareLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    window.open(lineUrl, '_blank', 'width=600,height=400');
  };

  const handleCrosspost = () => {
    router.push(`/create-post?source_id=${postId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1.5 bg-muted/30 hover:bg-muted/50 px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
          <Share2 size={16} />
          <span className="font-medium">แชร์</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCrosspost}>
          <Repeat2 className="mr-2 h-4 w-4" />
          <span>โพสต์ข้าม</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="mr-2 h-4 w-4" />
          <span>คัดลอกลิงก์</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          <span>แชร์ผ่าน Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter}>
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>แชร์ผ่าน X (Twitter)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareLine}>
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>แชร์ผ่าน Line</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
