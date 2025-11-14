"use client";

import { useDrawer } from '@/shared/contexts/DrawerContext';
import { MediaViewerDrawer } from './MediaViewerDrawer';
import { CommentDrawer } from './CommentDrawer';

/**
 * DrawerManager - Master Component for All Drawers
 *
 * Responsibilities:
 * - Listen to drawer context state
 * - Render the appropriate drawer based on type
 * - Handle drawer lifecycle
 *
 * Usage:
 * Add to root layout once:
 * <DrawerProvider>
 *   {children}
 *   <DrawerManager />
 * </DrawerProvider>
 */
export function DrawerManager() {
  const { drawer, closeDrawer } = useDrawer();

  if (!drawer.isOpen || !drawer.type) return null;

  switch (drawer.type) {
    case 'media-viewer':
      return (
        <MediaViewerDrawer
          media={drawer.data?.media || []}
          post={drawer.data?.post!}
          open={drawer.isOpen}
          initialIndex={drawer.data?.initialIndex || 0}
          onClose={closeDrawer}
        />
      );

    case 'comment-only':
      return (
        <CommentDrawer
          post={drawer.data?.post!}
          open={drawer.isOpen}
          onClose={closeDrawer}
        />
      );

    // Future drawer types
    case 'post-detail':
      // TODO: Implement PostDetailDrawer (full post + media + comments)
      return null;

    case 'user-profile':
      // TODO: Implement UserProfileDrawer
      return null;

    case 'create-post':
      // TODO: Implement CreatePostDrawer
      return null;

    case 'notifications':
      // TODO: Implement NotificationDrawer
      return null;

    default:
      console.warn(`Unknown drawer type: ${drawer.type}`);
      return null;
  }
}
