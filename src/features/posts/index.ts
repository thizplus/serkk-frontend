// Posts Feature Barrel Export

// Components
export { PostCard } from './components/PostCard';
export { PostFeed } from './components/PostFeed';
export { InfinitePostFeed } from './components/InfinitePostFeed';
export { CreatePostForm } from './components/CreatePostForm';
export { PostActions } from './components/PostActions';
export { VoteButtons } from './components/VoteButtons';
export { ShareDropdown } from './components/ShareDropdown';

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
export { useSavedPosts, useSavePost, useUnsavePost } from './hooks/useSaved';
export { useUploadMultipleMedia as useUploadMedia, useUploadImage, useUploadVideo, useDeleteMedia, useUploadMultipleMedia } from './hooks/useMedia';

// Types (re-export shared types for convenience)
export type { Post } from '@/shared/types';
