import { isRecord, readJson, STORAGE_PREFIX, writeJson } from '@shared/lib';
import { isChatMessage, type ChatMessage } from '@entities/message';
import { resolveChatTitle } from '../lib/title';
import type { ChatStoreState } from './store';
import type { Chat } from './types';

export const CHATS_SCHEMA_VERSION = 1;

export const MAX_STORED_MESSAGES = 200;

export const INTERRUPTED_SEND_ERROR = 'Отправка прервана';

const CHATS_KEY_PREFIX = `${STORAGE_PREFIX}chats:`;

export function chatsStorageKey(idInstance: string): string {
  return CHATS_KEY_PREFIX + idInstance;
}

function restoreMessage(message: ChatMessage): ChatMessage {
  return message.status === 'pending'
    ? { ...message, status: 'failed', error: INTERRUPTED_SEND_ERROR }
    : message;
}

function parseChat(value: unknown): Chat | null {
  if (!isRecord(value)) return null;

  const { chatId, title, phoneNumber, isGroup, messages, unread, lastActivity } = value;
  if (typeof chatId !== 'string' || !chatId || !Array.isArray(messages)) return null;

  const phone = typeof phoneNumber === 'string' ? phoneNumber : undefined;

  return {
    chatId,
    title: typeof title === 'string' && title ? title : resolveChatTitle(chatId, '', phone),
    ...(phone === undefined ? {} : { phoneNumber: phone }),
    isGroup: typeof isGroup === 'boolean' ? isGroup : chatId.startsWith('-'),
    messages: messages.filter(isChatMessage).map(restoreMessage),
    unread: typeof unread === 'number' && unread > 0 ? unread : 0,
    lastActivity: typeof lastActivity === 'number' ? lastActivity : 0,
  };
}

export function parsePersistedChats(data: unknown): ChatStoreState | null {
  if (!isRecord(data)) return null;

  if (data.version !== CHATS_SCHEMA_VERSION || !isRecord(data.chats)) return null;

  const chats: Record<string, Chat> = {};
  for (const value of Object.values(data.chats)) {
    const chat = parseChat(value);
    if (chat) chats[chat.chatId] = chat;
  }

  const { activeChatId } = data;
  return {
    chats,
    activeChatId: typeof activeChatId === 'string' && chats[activeChatId] ? activeChatId : null,
  };
}

export function loadChatStore(idInstance: string): ChatStoreState | null {
  return parsePersistedChats(readJson(chatsStorageKey(idInstance)));
}

export function saveChatStore(idInstance: string, state: ChatStoreState): boolean {
  return writeJson(chatsStorageKey(idInstance), {
    version: CHATS_SCHEMA_VERSION,
    chats: Object.fromEntries(
      Object.entries(state.chats).map(([chatId, chat]) => [
        chatId,
        { ...chat, messages: chat.messages.slice(-MAX_STORED_MESSAGES) },
      ]),
    ),
    activeChatId: state.activeChatId,
  });
}
