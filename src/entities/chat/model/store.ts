import { advanceStatus, type ChatMessage, type MessageStatus } from '@entities/message';
import { pickChatTitle } from '../lib/title';
import { findLocalCopy, insertByTime, withQuoteText, withStatus } from './messages';
import type { Chat } from './types';

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
      timestamp?: number;
    }
  | { type: 'setActive'; chatId: string | null }
  | { type: 'markRead'; chatId: string }
  | { type: 'addMessage'; message: ChatMessage; echo?: boolean; pageHidden?: boolean }
  | { type: 'resolveOutgoing'; chatId: string; localId: string; idMessage: string }
  | { type: 'failOutgoing'; chatId: string; localId: string; error: string }
  | { type: 'retryOutgoing'; chatId: string; messageId: string; localId: string }
  | {
      type: 'updateStatus';
      chatId: string;
      idMessage: string;
      status: MessageStatus;
      error?: string;
    };

type ActionOf<T extends ChatStoreAction['type']> = Extract<ChatStoreAction, { type: T }>;

export const initialChatStoreState: ChatStoreState = { chats: {}, activeChatId: null };

function withChat(
  state: ChatStoreState,
  chatId: string,
  updater: (chat: Chat) => Chat,
): ChatStoreState {
  const existing = state.chats[chatId];
  if (!existing) return state;
  const updated = updater(existing);
  return updated === existing ? state : { ...state, chats: { ...state.chats, [chatId]: updated } };
}

function replaceMessage(chat: Chat, from: ChatMessage, to: ChatMessage): Chat {
  return { ...chat, messages: chat.messages.map((message) => (message === from ? to : message)) };
}

function ensureChat(state: ChatStoreState, action: ActionOf<'ensureChat'>): ChatStoreState {
  const { chatId, phoneNumber } = action;
  const existing = state.chats[chatId];
  const activeChatId = action.activate ? chatId : state.activeChatId;

  if (!existing) {
    const chat: Chat = {
      chatId,
      title: action.title,
      ...(phoneNumber ? { phoneNumber } : {}),
      isGroup: action.isGroup ?? chatId.startsWith('-'),
      messages: [],
      unread: 0,
      lastActivity: action.timestamp ?? Date.now(),
    };
    return { chats: { ...state.chats, [chatId]: chat }, activeChatId };
  }

  const updated: Chat = {
    ...existing,
    title: pickChatTitle(existing.title, action.title, chatId),
    ...(existing.phoneNumber || !phoneNumber ? {} : { phoneNumber }),
    unread: action.activate ? 0 : existing.unread,
  };
  const changed =
    updated.title !== existing.title ||
    updated.phoneNumber !== existing.phoneNumber ||
    updated.unread !== existing.unread;

  if (!changed && activeChatId === state.activeChatId) return state;
  return { chats: changed ? { ...state.chats, [chatId]: updated } : state.chats, activeChatId };
}

function addMessage(state: ChatStoreState, action: ActionOf<'addMessage'>): ChatStoreState {
  const { message } = action;

  return withChat(state, message.chatId, (chat) => {
    const known = chat.messages.find((item) => item.id === message.id);
    if (known) {
      if (!action.echo || known.timestamp === message.timestamp) return chat;
      const others = chat.messages.filter((item) => item !== known);
      return {
        ...chat,
        messages: insertByTime(others, { ...known, timestamp: message.timestamp }),
      };
    }

    const local = action.echo ? findLocalCopy(chat.messages, message) : undefined;
    if (local) {
      const confirmed = withStatus(
        { ...local, id: message.id, timestamp: message.timestamp },
        'sent',
      );
      return {
        ...chat,
        messages: insertByTime(
          chat.messages.filter((item) => item !== local),
          confirmed,
        ),
        lastActivity: Math.max(chat.lastActivity, message.timestamp),
      };
    }

    const isUnread =
      !message.outgoing && (action.pageHidden === true || state.activeChatId !== message.chatId);

    return {
      ...chat,
      messages: insertByTime(chat.messages, withQuoteText(message, chat.messages)),
      lastActivity: Math.max(chat.lastActivity, message.timestamp),
      unread: isUnread ? chat.unread + 1 : chat.unread,
    };
  });
}

function resolveOutgoing(chat: Chat, localId: string, idMessage: string): Chat {
  const local = chat.messages.find((message) => message.id === localId);
  if (!local) return chat;

  const sent = withStatus({ ...local, id: idMessage }, 'sent');
  const echo = chat.messages.find((message) => message.id === idMessage);
  if (!echo) return replaceMessage(chat, local, sent);

  const resolved = withStatus(sent, advanceStatus(sent.status, echo.status), echo.error);
  return replaceMessage(
    { ...chat, messages: chat.messages.filter((message) => message !== echo) },
    local,
    resolved,
  );
}

function failOutgoing(chat: Chat, localId: string, error: string): Chat {
  const local = chat.messages.find((message) => message.id === localId);
  if (local?.status !== 'pending') return chat;
  return replaceMessage(chat, local, withStatus(local, 'failed', error));
}

function retryOutgoing(chat: Chat, messageId: string, localId: string): Chat {
  const failed = chat.messages.find(
    (message) => message.id === messageId && message.outgoing && message.status === 'failed',
  );
  if (!failed) return chat;
  return replaceMessage(chat, failed, { ...withStatus(failed, 'pending'), id: localId });
}

function updateStatus(chat: Chat, action: ActionOf<'updateStatus'>): Chat {
  const target = chat.messages.find(
    (message) => message.id === action.idMessage && message.outgoing,
  );
  if (!target) return chat;

  const status = advanceStatus(target.status, action.status);
  if (status === target.status) return chat;
  return replaceMessage(chat, target, withStatus(target, status, action.error));
}

export function chatStoreReducer(state: ChatStoreState, action: ChatStoreAction): ChatStoreState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'reset':
      return initialChatStoreState;

    case 'ensureChat':
      return ensureChat(state, action);

    case 'setActive': {
      if (!action.chatId) return { ...state, activeChatId: null };
      const next = withChat(state, action.chatId, (chat) => ({ ...chat, unread: 0 }));
      return { ...next, activeChatId: action.chatId };
    }

    case 'markRead':
      return withChat(state, action.chatId, (chat) =>
        chat.unread === 0 ? chat : { ...chat, unread: 0 },
      );

    case 'addMessage':
      return addMessage(state, action);

    case 'resolveOutgoing':
      return withChat(state, action.chatId, (chat) =>
        resolveOutgoing(chat, action.localId, action.idMessage),
      );

    case 'failOutgoing':
      return withChat(state, action.chatId, (chat) =>
        failOutgoing(chat, action.localId, action.error),
      );

    case 'retryOutgoing':
      return withChat(state, action.chatId, (chat) =>
        retryOutgoing(chat, action.messageId, action.localId),
      );

    case 'updateStatus':
      return withChat(state, action.chatId, (chat) => updateStatus(chat, action));

    default:
      return state;
  }
}
