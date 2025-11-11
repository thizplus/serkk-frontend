/**
 * Shared types for Media Display components
 */

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export type MediaDisplayVariant = 'feed' | 'detail';

export interface BaseMediaProps {
  variant?: MediaDisplayVariant;
  className?: string;
}

export interface MediaItemProps extends BaseMediaProps {
  media: MediaItem;
  index: number;
  editable?: boolean;
  onClick?: (index: number) => void;
  onRemove?: (index: number) => void;
  showOverlay?: boolean;
  remainingCount?: number;
}

export interface GridLayoutProps extends BaseMediaProps {
  media: MediaItem[];
  editable?: boolean;
  onMediaClick?: (index: number) => void;
  onRemove?: (index: number) => void;
}

export interface MediaDisplayProps extends BaseMediaProps {
  media: MediaItem[];
  editable?: boolean;
  onRemove?: (index: number) => void;
}
