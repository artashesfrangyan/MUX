import { isLocalMessageId, type ChatMessage, type MessageStatus } from '@entities/message';

export const ECHO_MATCH_WINDOW_MS = 2 * 60_000;

export function insertByTime(
  messages: readonly ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  let index = messages.length;
  while (index > 0 && (messages[index - 1]?.timestamp ?? 0) > message.timestamp) index -= 1;
  return [...messages.slice(0, index), message, ...messages.slice(index)];
}

export function withStatus(
  message: ChatMessage,
  status: MessageStatus,
  error?: string,
): ChatMessage {
  const { error: previousError, ...rest } = message;
  if (status !== 'failed') return { ...rest, status };
  const text = error ?? previousError;
  return text === undefined ? { ...rest, status } : { ...rest, status, error: text };
}

export function findLocalCopy(
  messages: readonly ChatMessage[],
  echo: ChatMessage,
): ChatMessage | undefined {
  return messages.find(
    (message) =>
      message.outgoing &&
      isLocalMessageId(message.id) &&
      (message.status === 'pending' || message.status === 'failed') &&
      message.text === echo.text &&
      Math.abs(message.timestamp - echo.timestamp) <= ECHO_MATCH_WINDOW_MS,
  );
}

export function withQuoteText(message: ChatMessage, history: readonly ChatMessage[]): ChatMessage {
  const reply = message.replyTo;
  if (!reply || reply.text !== undefined) return message;
  const quoted = history.find((item) => item.id === reply.idMessage);
  return quoted ? { ...message, replyTo: { ...reply, text: quoted.text } } : message;
}
