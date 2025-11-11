/**
 * Media Display Components
 *
 * Export all media-related components
 */

// Main component (recommended usage)
export { MediaDisplay } from './MediaDisplay';

// Individual components (for advanced usage)
export { SingleVideoPlayer } from './SingleVideoPlayer';
export { SingleImageViewer } from './SingleImageViewer';
export { MultiMediaGrid } from './MultiMediaGrid';

// Grid layouts (internal, but exported for flexibility)
export { GridLayout2 } from './GridLayout2';
export { GridLayout3 } from './GridLayout3';
export { GridLayout4 } from './GridLayout4';
export { GridLayout5Plus } from './GridLayout5Plus';

// Reusable components
export { MediaItem } from './MediaItem';
export { MediaLightbox } from './MediaLightbox';

// Legacy component (deprecated - use MediaDisplay instead)
export { MediaGrid } from './MediaGrid';

// Types
export type {
  MediaItem as MediaItemType,
  MediaDisplayVariant,
  MediaDisplayProps,
  BaseMediaProps,
  MediaItemProps,
  GridLayoutProps,
} from './types';
