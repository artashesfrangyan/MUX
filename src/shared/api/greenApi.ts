import { isRecord } from '@shared/lib';
import { DEMO_API_URL, isDemoApiUrl } from './demo/demoMode';
import { demoTransport } from './demo/demoTransport';
import {
  errorFromReason,
  errorFromResponse,
  GreenApiError,
  invalidResponseError,
  isAbortError,
  networkError,
  timeoutError,
} from './errors';
import { parseInstanceSettings } from './settings';
import { fetchTransport, type HttpMethod, type Transport } from './transport';
import type {
  CheckAccountResult,
  Credentials,
  InstanceSettings,
  NotificationBody,
  NotificationEnvelope,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export const DEFAULT_API_URL = 'https://api.green-api.com';

export function normalizeApiUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return DEFAULT_API_URL;
  if (isDemoApiUrl(url)) return DEMO_API_URL;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

function transportFor(apiUrl: string): Transport {
  return isDemoApiUrl(apiUrl) ? demoTransport : fetchTransport;
}

interface RequestOptions {
  httpMethod?: HttpMethod;
  pathParam?: string;
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function request(
  credentials: Credentials,
  method: string,
  { httpMethod = 'GET', pathParam, query, body, timeoutMs = 20_000, signal }: RequestOptions = {},
): Promise<string> {
  signal?.throwIfAborted();

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const apiUrl = normalizeApiUrl(credentials.apiUrl);
  try {
    const { status, text } = await transportFor(apiUrl)({
      credentials: {
        apiUrl,
        idInstance: credentials.idInstance.trim(),
        apiTokenInstance: credentials.apiTokenInstance.trim(),
      },
      method,
      httpMethod,
      pathParam,
      query,
      body,
      signal: controller.signal,
    });

    if (status < 200 || status >= 300) throw errorFromResponse(status, text);
    return text;
  } catch (error) {
    if (error instanceof GreenApiError) throw error;
    if (isAbortError(error)) {
      if (signal?.aborted) throw error;
      throw timeoutError();
    }
    throw networkError();
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function parseJson(text: string, method: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw invalidResponseError(method, text.slice(0, 200));
  }
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  const text = await request(credentials, 'sendMessage', {
    httpMethod: 'POST',
    body: { chatId, message },
    signal,
  });
  const data = parseJson(text, 'sendMessage');
  const idMessage = isRecord(data) ? data.idMessage : undefined;
  if (typeof idMessage !== 'string' || !idMessage) throw invalidResponseError('sendMessage', text);
  return { idMessage };
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<NotificationEnvelope | null> {
  const timeout = Math.min(60, Math.max(5, receiveTimeout));
  const text = await request(credentials, 'receiveNotification', {
    query: { receiveTimeout: String(timeout) },
    timeoutMs: (timeout + 15) * 1000,
    signal,
  });

  if (!text.trim()) return null;
  const data = parseJson(text, 'receiveNotification');
  if (!isRecord(data) || typeof data.receiptId !== 'number') return null;

  const body = (isRecord(data.body) ? data.body : {}) as unknown as NotificationBody;
  return { receiptId: data.receiptId, body };
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<boolean> {
  const text = await request(credentials, 'deleteNotification', {
    httpMethod: 'DELETE',
    pathParam: String(receiptId),
    timeoutMs: 15_000,
    signal,
  });
  if (!text.trim()) return false;
  const data = parseJson(text, 'deleteNotification');
  return isRecord(data) && data.result === true;
}

export interface CheckAccountOptions {
  force?: boolean;
  signal?: AbortSignal;
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
  { force = false, signal }: CheckAccountOptions = {},
): Promise<CheckAccountResult> {
  const text = await request(credentials, 'checkAccount', {
    httpMethod: 'POST',
    body: { phoneNumber: Number(phoneNumber), force },
    timeoutMs: 25_000,
    signal,
  });
  const data = parseJson(text, 'checkAccount');
  if (!isRecord(data)) throw invalidResponseError('checkAccount', text);

  if (data.status === false) {
    const reason = typeof data.reason === 'string' ? data.reason : '';
    const message = `GREEN-API не смог проверить номер: ${reason || 'нет ответа'}`;
    throw errorFromReason(reason) ?? new GreenApiError('badRequest', message, { detail: reason });
  }

  const { exist, chatId } = data;
  const id = typeof chatId === 'string' || typeof chatId === 'number' ? String(chatId) : '';
  if (typeof exist !== 'boolean' || (exist && !id)) {
    throw invalidResponseError('checkAccount', text);
  }
  return { exist, chatId: exist ? id : '', fromCache: data.fromCache === true };
}

export async function getStateInstance(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<StateInstanceResponse> {
  const text = await request(credentials, 'getStateInstance', { timeoutMs: 15_000, signal });
  const data = parseJson(text, 'getStateInstance');
  const stateInstance = isRecord(data) ? data.stateInstance : undefined;
  if (typeof stateInstance !== 'string' || !stateInstance) {
    throw invalidResponseError('getStateInstance', text);
  }
  return { stateInstance };
}

export async function getSettings(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<InstanceSettings> {
  const text = await request(credentials, 'getSettings', { timeoutMs: 15_000, signal });
  const data = parseJson(text, 'getSettings');
  if (!isRecord(data)) throw invalidResponseError('getSettings', text);
  return parseInstanceSettings(data);
}

export async function setSettings(
  credentials: Credentials,
  patch: Partial<InstanceSettings>,
  signal?: AbortSignal,
): Promise<void> {
  const text = await request(credentials, 'setSettings', {
    httpMethod: 'POST',
    body: patch,
    signal,
  });
  const data = parseJson(text, 'setSettings');
  if (!isRecord(data) || data.saveSettings !== true) {
    throw new GreenApiError(
      'invalidResponse',
      'GREEN-API не подтвердил сохранение настроек инстанса.',
      { detail: text },
    );
  }
}
