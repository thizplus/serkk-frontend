// Posts Feature Barrel Export

// Components
export { PostCard } from './components/PostCard';
export { PostDetail } from './components/PostDetail';
export { PostFeed } from './components/PostFeed';
export { InfinitePostFeed } from './components/InfinitePostFeed';
export { CreatePostForm } from './components/CreatePostForm';
export { PostActions } from './components/PostActions';
export { VoteButtons } from './components/VoteButtons';
export { ShareDropdown } from './components/ShareDropdown';
export { OptimisticPostCard } from './components/OptimisticPostCard'; // ✅ Phase 1
export { OptimisticPostItem } from './components/OptimisticPostItem'; // ✅ Phase 1

// Hooks
export {
  usePosts,
  usePost,
  useUserPosts,
  useInfiniteUserPosts,
  useInfinitePosts,
  useInfinitePostsByTagId,
  useCreatePost,
  useCreateCrosspost,
  useUpdatePost,
  useDeletePost,
} from './hooks/usePosts';

export { useVote, useToggleVote } from './hooks/useVotes';
export { useSavedPosts, useInfiniteSavedPosts, useSavePost, useUnsavePost, useToggleSave } from './hooks/useSaved';
export { useUploadMultipleMedia as useUploadMedia, useUploadImage, useUploadVideo, useDeleteMedia, useUploadMultipleMedia } from './hooks/useMedia';
export { useOptimisticPost } from './hooks/useOptimisticPost'; // ✅ Phase 2

// WebSocket hooks
export { usePostWebSocket } from './hooks/usePostWebSocket';
export { useVoteWebSocket } from './hooks/useVoteWebSocket';

// Stores
export { useOptimisticPostStore } from './stores/optimisticPostStore'; // ✅ Phase 2
export type { OptimisticPost } from './stores/optimisticPostStore'; // ✅ Phase 2

// Types (re-export shared types for convenience)
export type { Post } from '@/types';
