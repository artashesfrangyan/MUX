import { phoneChatTitle } from '@shared/lib';

export function chatTitleFromChatId(chatId: string): string {
  return chatId.startsWith('-') ? `Группа ${chatId}` : `Контакт ${chatId}`;
}

export function resolveChatTitle(chatId: string, name?: string, phoneNumber?: string): string {
  return name || (phoneChatTitle(phoneNumber) ?? chatTitleFromChatId(chatId));
}

const PHONE_LIKE = /^\+?[\d\s()-]+$/;

function titleRank(title: string, chatId: string): number {
  if (!title || title === chatTitleFromChatId(chatId)) return 0;
  return PHONE_LIKE.test(title) ? 1 : 2;
}

export function pickChatTitle(current: string, candidate: string, chatId: string): string {
  return titleRank(candidate, chatId) > titleRank(current, chatId) ? candidate : current;
}
