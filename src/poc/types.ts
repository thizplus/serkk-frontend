import type { Post } from '@/types/models';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface MediaViewerProps {
  media: MediaItem[];
  post: Post; // Add full post data for vote/comments
  open: boolean;
  initialIndex?: number;
  onClose: () => void;
}
