// Profile Feature Barrel Export

// Components
export { UserCard } from './components/UserCard';
export { ProfileContent } from './components/ProfileContent';

// Hooks - Queries
export {
  useProfile,
  useUserProfile,
  useUsers,
  userKeys
} from './hooks/useUsers';

export {
  useFollowers,
  useFollowing,
  useMutualFollows,
  useFollowStatus,
  followKeys
} from './hooks/useFollows';

// Hooks - Mutations
export {
  useFollowUser,
  useUnfollowUser,
  useToggleFollow
} from './hooks/useFollowMutations';

export {
  useUpdateProfile,
  useDeleteAccount
} from './hooks/useUsersMutations';

// Types (re-export shared types for convenience)
export type {
  User,
  UserWithFollowStatus,
  UpdateProfileRequest
} from '@/shared/types';
