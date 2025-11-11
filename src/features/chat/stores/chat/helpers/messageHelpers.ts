import type { ChatMessage } from '@/shared/types/models';

/**
 * Sort messages by date (ascending)
 */
export const sortMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

/**
 * Reverse messages order (for pagination)
 */
export const reverseMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return [...messages].reverse();
};

/**
 * Generate temporary message ID
 */
export const generateTempMessageId = (): string => {
  return `temp-${Date.now()}-${Math.random()}`;
};

/**
 * Check if message is from current user
 */
export const isOwnMessage = (message: ChatMessage, currentUserId: string): boolean => {
  return message.sender?.id === currentUserId;
};

/**
 * Get message type from FormData
 */
export const getMessageType = (formData: FormData): string => {
  return (formData.get('type') as string) || 'text';
};
