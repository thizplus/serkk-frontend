// Comments Feature Barrel Export

// Components
export { CommentCard } from './components/CommentCard';
export { CommentForm } from './components/CommentForm';
export { CommentList } from './components/CommentList';
export { CommentTree } from './components/CommentTree';
export { CommentActions } from './components/CommentActions';
export { DeleteCommentDialog } from './components/DeleteCommentDialog';
export { ProfileCommentCard } from './components/ProfileCommentCard';

// Hooks
export {
  useComments,
  useCommentTree,
  useCommentsByAuthor,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  commentKeys
} from './hooks/useComments';

// Types (re-export shared types for convenience)
export type {
  Comment,
  CreateCommentRequest,
  UpdateCommentRequest,
  GetCommentsParams
} from '@/shared/types';
