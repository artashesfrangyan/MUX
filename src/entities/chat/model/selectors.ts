import type { ChatStoreState } from './store';
import type { Chat } from './types';

export function sortChatsByActivity(chats: Record<string, Chat>): Chat[] {
  return Object.values(chats).sort((a, b) => b.lastActivity - a.lastActivity);
}

export function selectActiveChat(state: ChatStoreState): Chat | null {
  return state.activeChatId ? (state.chats[state.activeChatId] ?? null) : null;
}

export function countUnread(chats: readonly Chat[]): number {
  return chats.reduce((sum, chat) => sum + chat.unread, 0);
}
