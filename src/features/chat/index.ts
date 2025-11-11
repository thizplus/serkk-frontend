// Chat Feature Barrel Export

// Components
export { ChatWindow } from './components/ChatWindow';
export { ChatList } from './components/ChatList';
export { ChatListItem } from './components/ChatListItem';
export { ChatMessage } from './components/ChatMessage';
export { ChatInput } from './components/ChatInput';
export { ChatHeader } from './components/ChatHeader';
export { ChatSidebar } from './components/ChatSidebar';
export { EmojiPicker } from './components/EmojiPicker';
export { OnlineStatus } from './components/OnlineStatus';
export { UserSearchDialog } from './components/UserSearchDialog';
export { ChatProfileSheet } from './components/ChatProfileSheet';
export { ChatMessageFile } from './components/ChatMessageFile';
export { ChatMessageImage } from './components/ChatMessageImage';
export { ChatMessageVideo } from './components/ChatMessageVideo';

// Stores (re-export from chat/ subfolder)
export {
  useChatStore,
  useConversationMessages,
  useUnreadCount,
  useTypingUsers,
  useUserOnlineStatus,
  useActiveConversationId,
} from './stores/chat';

// Types (re-export shared types for convenience)
export type { Conversation } from '@/types';
