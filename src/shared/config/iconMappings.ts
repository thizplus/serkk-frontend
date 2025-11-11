// lib/config/iconMappings.ts
// Icon mappings for different contexts
// การจับคู่ไอคอนสำหรับแต่ละสถานการณ์

import type { IconName } from './icons';

// Notification type to icon mapping
export const NOTIFICATION_ICONS: Record<string, IconName> = {
  reply: 'MessageSquare',
  comment: 'MessageSquare',
  vote: 'ThumbsUp',
  upvote: 'ThumbsUp',
  downvote: 'ThumbsDown',
  follow: 'UserPlus',
  mention: 'AtSign',
  message: 'Send',
  chat: 'MessageCircle',
  like: 'Heart',
  share: 'Share2',
  bookmark: 'Bookmark',
};

// Post action icons
export const POST_ACTION_ICONS = {
  like: 'Heart',
  comment: 'MessageSquare',
  share: 'Share2',
  bookmark: 'Bookmark',
  edit: 'Edit',
  delete: 'Trash2',
  more: 'MoreHorizontal',
  vote: 'ThumbsUp',
  upvote: 'ThumbsUp',
  downvote: 'ThumbsDown',
  save: 'Bookmark',
  report: 'Flag',
  pin: 'Pin',
} as const;

// Comment action icons
export const COMMENT_ACTION_ICONS = {
  reply: 'Reply',
  edit: 'Edit',
  delete: 'Trash2',
  more: 'MoreHorizontal',
  upvote: 'ThumbsUp',
  downvote: 'ThumbsDown',
  report: 'Flag',
} as const;

// Chat action icons
export const CHAT_ACTION_ICONS = {
  send: 'Send',
  attach: 'Paperclip',
  emoji: 'Smile',
  delete: 'Trash2',
  more: 'MoreHorizontal',
  block: 'Ban',
  search: 'Search',
} as const;

// Media type icons
export const MEDIA_TYPE_ICONS = {
  image: 'ImageIcon',
  video: 'Video',
  file: 'File',
  link: 'LinkIcon',
} as const;

// User action icons
export const USER_ACTION_ICONS = {
  follow: 'UserPlus',
  unfollow: 'UserMinus',
  message: 'MessageCircle',
  block: 'Ban',
  report: 'Flag',
  share: 'Share2',
  more: 'MoreHorizontal',
  settings: 'Settings',
  logout: 'LogOut',
} as const;

// Status icons
export const STATUS_ICONS = {
  success: 'CheckCircle',
  error: 'XCircle',
  warning: 'AlertTriangle',
  info: 'Info',
  loading: 'Loader2',
} as const;

// Sort/Filter icons
export const SORT_FILTER_ICONS = {
  hot: 'TrendingUp',
  new: 'Sparkles',
  top: 'Star',
  old: 'Clock',
  filter: 'Filter',
  sort: 'SlidersHorizontal',
} as const;

// Empty state icons
export const EMPTY_STATE_ICONS = {
  noPosts: 'FileText',
  noComments: 'MessageSquare',
  noNotifications: 'Bell',
  noMessages: 'MessageCircle',
  noUsers: 'Users',
  noResults: 'Search',
  noBookmarks: 'Bookmark',
} as const;
