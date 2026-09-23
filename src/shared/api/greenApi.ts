import type {
  CheckAccountResponse,
  Credentials,
  NotificationEnvelope,
  SendMessageResponse,
  StateInstanceResponse,
} from '@shared/types';

/**
 * Тонкий клиент HTTP API GREEN-API MAX (v3).
 *
 * Формат вызова методов (https://green-api.com/v3/docs/api/request-format/):
 *   {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
 *
 * Используются только методы, необходимые для текстовой переписки:
 *   SendMessage         — отправка текстового сообщения
 *   ReceiveNotification — получение входящего уведомления (long polling)
 *   DeleteNotification  — подтверждение обработки уведомления
 *   CheckAccount        — получение chatId по номеру телефона (создание нового чата)
 *   GetStateInstance    — проверка авторизации инстанса
 *   SetSettings         — включение получения уведомлений через HTTP API
 */

/** Хост API по умолчанию. В личном кабинете может быть выдан другой (кластерный) apiUrl. */
export const DEFAULT_API_URL = 'https://api.green-api.com';

/** Ошибка обращения к GREEN-API (сеть, HTTP-код или ошибка валидации) */
export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

/** Приводит apiUrl к виду https://host без завершающего слэша */
export function normalizeApiUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return DEFAULT_API_URL;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

function buildUrl(credentials: Credentials, method: string, suffix = ''): string {
  const { apiUrl, idInstance, apiTokenInstance } = credentials;
  return `${normalizeApiUrl(apiUrl)}/waInstance${idInstance.trim()}/${method}/${apiTokenInstance.trim()}${suffix}`;
}

/** Достаёт человекочитаемое сообщение об ошибке из ответа GREEN-API */
function extractErrorMessage(payload: string, status: number): string {
  if (!payload) return `Ошибка запроса (HTTP ${status})`;

  try {
    const data = JSON.parse(payload) as Record<string, unknown>;
    const candidate =
      (data.message as string | undefined) ??
      (data.reason as string | undefined) ??
      (data.description as string | undefined) ??
      (data.error as string | undefined);
    if (candidate) return String(candidate);
    return JSON.stringify(data);
  } catch {
    const text = payload.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (status === 403) {
      return 'Сервис вернул 403 Forbidden. Проверьте apiUrl и доступность сервиса из вашей сети.';
    }
    return text ? `${text} (HTTP ${status})` : `Ошибка запроса (HTTP ${status})`;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** таймаут запроса в миллисекундах (long polling у ReceiveNotification) */
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function request(
  credentials: Credentials,
  method: string,
  suffix: string,
  { method: httpMethod = 'GET', body, timeoutMs = 20_000, signal }: RequestOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  // внешний сигнал (остановка опроса) тоже прерывает запрос
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(buildUrl(credentials, method, suffix), {
      method: httpMethod,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new GreenApiError(extractErrorMessage(text, response.status), response.status);
    }
    return text;
  } catch (error) {
    if (error instanceof GreenApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      // прерывание по внешнему сигналу — не ошибка, по таймауту — ошибка
      if (signal?.aborted) throw error;
      throw new GreenApiError('Превышено время ожидания ответа от GREEN-API');
    }
    throw new GreenApiError(
      'Не удалось выполнить запрос к GREEN-API. Проверьте apiUrl, подключение к сети и CORS.',
    );
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** SendMessage — отправка текстового сообщения. Возвращает idMessage. */
export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse> {
  const text = await request(credentials, 'sendMessage', '', {
    method: 'POST',
    body: { chatId, message },
    timeoutMs: 20_000,
  });
  const data = JSON.parse(text) as SendMessageResponse;
  if (!data?.idMessage) {
    throw new GreenApiError('GREEN-API не вернул идентификатор отправленного сообщения');
  }
  return data;
}

/**
 * ReceiveNotification — получение одного входящего уведомления.
 * Возвращает null, если очередь пуста (сервис завершил запрос по таймауту).
 */
export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<NotificationEnvelope | null> {
  const timeout = Math.min(60, Math.max(5, receiveTimeout));
  const text = await request(credentials, 'receiveNotification', `?receiveTimeout=${timeout}`, {
    timeoutMs: (timeout + 15) * 1000,
    signal,
  });

  if (!text || !text.trim() || text.trim() === '{}') return null;

  const data = JSON.parse(text) as NotificationEnvelope | null;
  if (!data || typeof data.receiptId !== 'number' || !data.body) return null;
  return data;
}

/** DeleteNotification — подтверждение обработки уведомления (обязательный шаг) */
export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<boolean> {
  const text = await request(credentials, 'deleteNotification', `/${receiptId}`, {
    method: 'DELETE',
    timeoutMs: 15_000,
  });
  if (!text || !text.trim()) return false;
  const data = JSON.parse(text) as { result?: boolean };
  return Boolean(data?.result);
}

/**
 * CheckAccount — проверка наличия аккаунта MAX на номере и получение chatId.
 * Именно этот метод используется для «создания» нового чата по номеру телефона.
 */
export async function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
  force = true,
): Promise<CheckAccountResponse> {
  const text = await request(credentials, 'checkAccount', '', {
    method: 'POST',
    body: { phoneNumber: Number(phoneNumber), force },
    timeoutMs: 25_000,
  });
  return JSON.parse(text) as CheckAccountResponse;
}

/** GetStateInstance — состояние авторизации инстанса */
export async function getStateInstance(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<StateInstanceResponse> {
  const text = await request(credentials, 'getStateInstance', '', { timeoutMs: 15_000, signal });
  return JSON.parse(text) as StateInstanceResponse;
}

/** SetSettings — включаем получение уведомлений через HTTP API (webhookUrl должен быть пустым) */
export async function setHttpApiSettings(credentials: Credentials): Promise<void> {
  await request(credentials, 'setSettings', '', {
    method: 'POST',
    body: {
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      stateWebhook: 'yes',
    },
    timeoutMs: 20_000,
  });
}
