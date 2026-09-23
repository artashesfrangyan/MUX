import type { Chat, ChatMessage, MessageStatus } from '../types';

export interface ChatStoreState {
  chats: Record<string, Chat>;
  activeChatId: string | null;
}

export type ChatStoreAction =
  | { type: 'hydrate'; state: ChatStoreState }
  | { type: 'reset' }
  | {
      type: 'ensureChat';
      chatId: string;
      title: string;
      phoneNumber?: string;
      isGroup?: boolean;
      activate?: boolean;
    }
  | { type: 'setActive'; chatId: string | null }
  | { type: 'removeChat'; chatId: string }
  | { type: 'addMessage'; message: ChatMessage; incrementUnread: boolean }
  | { type: 'updateMessage'; chatId: string; messageId: string; patch: Partial<ChatMessage> }
  | { type: 'markRead'; chatId: string };

export const initialChatStoreState: ChatStoreState = { chats: {}, activeChatId: null };

/** Плейсхолдер вместо названия чата, если мессенджер не передал имя контакта */
export function chatTitleFromChatId(chatId: string): string {
  if (chatId.endsWith('@c.us')) return `+${chatId.replace('@c.us', '')}`;
  return chatId.startsWith('-') ? `Группа ${chatId}` : `Контакт ${chatId}`;
}

function withChat(
  state: ChatStoreState,
  chatId: string,
  updater: (chat: Chat) => Chat,
): ChatStoreState {
  const existing = state.chats[chatId];
  if (!existing) return state;
  return { ...state, chats: { ...state.chats, [chatId]: updater(existing) } };
}

export function chatStoreReducer(state: ChatStoreState, action: ChatStoreAction): ChatStoreState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'reset':
      return initialChatStoreState;

    case 'ensureChat': {
      const existing = state.chats[action.chatId];

      if (existing) {
        const updated: Chat = {
          ...existing,
          title: existing.title || action.title,
          phoneNumber: existing.phoneNumber ?? action.phoneNumber,
        };
        return {
          chats: { ...state.chats, [action.chatId]: updated },
          activeChatId: action.activate ? action.chatId : state.activeChatId,
        };
      }

      const chat: Chat = {
        chatId: action.chatId,
        title: action.title,
        phoneNumber: action.phoneNumber,
        isGroup: action.isGroup ?? action.chatId.startsWith('-'),
        messages: [],
        unread: 0,
        lastActivity: Date.now(),
      };

      return {
        chats: { ...state.chats, [action.chatId]: chat },
        activeChatId: action.activate ? action.chatId : state.activeChatId,
      };
    }

    case 'setActive': {
      if (!action.chatId) return { ...state, activeChatId: null };
      const next = withChat(state, action.chatId, (chat) => ({ ...chat, unread: 0 }));
      return { ...next, activeChatId: action.chatId };
    }

    case 'removeChat': {
      const chats = { ...state.chats };
      delete chats[action.chatId];
      return {
        chats,
        activeChatId: state.activeChatId === action.chatId ? null : state.activeChatId,
      };
    }

    case 'addMessage': {
      const { message } = action;
      return withChat(state, message.chatId, (chat) => {
        if (chat.messages.some((item) => item.id === message.id)) return chat;
        return {
          ...chat,
          messages: [...chat.messages, message],
          lastActivity: Math.max(chat.lastActivity, message.timestamp),
          unread:
            action.incrementUnread && !message.outgoing ? chat.unread + 1 : chat.unread,
        };
      });
    }

    case 'updateMessage':
      return withChat(state, action.chatId, (chat) => {
        const patched = chat.messages.map((item) =>
          item.id === action.messageId ? { ...item, ...action.patch } : item,
        );

        // после замены локального id на idMessage от GREEN-API в списке может
        // оказаться дубликат (если уведомление о своём же сообщении пришло раньше
        // ответа SendMessage) — оставляем первое вхождение
        const seen = new Set<string>();
        const messages: ChatMessage[] = [];
        for (const item of patched) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          messages.push(item);
        }
        return { ...chat, messages };
      });

    case 'markRead':
      return withChat(state, action.chatId, (chat) =>
        chat.unread === 0 ? chat : { ...chat, unread: 0 },
      );

    default:
      return state;
  }
}

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'отправляется',
  sent: 'отправлено',
  delivered: 'доставлено',
  read: 'прочитано',
  failed: 'ошибка отправки',
};
