// Tags Feature Barrel Export

// Hooks
export {
  useTag,
  useTagByName,
  useTags,
  usePopularTags,
  useSearchTags,
  tagKeys
} from './hooks/useTags';

// Types (re-export shared types for convenience)
export type {
  Tag,
  GetTagsParams,
  GetPopularTagsParams,
  SearchTagsParams
} from '@/types';
