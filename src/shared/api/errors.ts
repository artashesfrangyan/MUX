import { isRecord } from '@shared/lib';

export type GreenApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'rateLimited'
  | 'quotaExceeded'
  | 'checkLimited'
  | 'instanceStarting'
  | 'webhookUrlSet'
  | 'badRequest'
  | 'server'
  | 'network'
  | 'timeout'
  | 'invalidResponse';

export class GreenApiError extends Error {
  readonly code: GreenApiErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(
    code: GreenApiErrorCode,
    message: string,
    { status, detail }: { status?: number; detail?: string } = {},
  ) {
    super(message);
    this.name = 'GreenApiError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

export const networkError = () =>
  new GreenApiError('network', 'Нет связи с GREEN-API, проверьте интернет и apiUrl.');

export const timeoutError = () =>
  new GreenApiError('timeout', 'GREEN-API не ответил вовремя. Повторите попытку.');

export const invalidResponseError = (method: string, detail?: string) =>
  new GreenApiError('invalidResponse', `GREEN-API вернул неожиданный ответ (${method}).`, {
    detail,
  });

const STATUS_ERRORS: Record<number, [GreenApiErrorCode, string]> = {
  401: ['unauthorized', 'Неверный apiTokenInstance, проверьте его в личном кабинете GREEN-API.'],
  403: ['forbidden', 'Неверный idInstance или apiUrl, проверьте их в личном кабинете GREEN-API.'],
  429: ['rateLimited', 'Слишком много запросов к GREEN-API, повторите через несколько секунд.'],
  466: ['quotaExceeded', 'Исчерпан месячный лимит тарифа GREEN-API.'],
  469: ['checkLimited', 'MAX временно ограничил проверку номеров, повторите через пару часов.'],
};

const REASON_ERRORS: Array<[RegExp, GreenApiErrorCode, string]> = [
  [
    /instance (in starting process|is starting)/i,
    'instanceStarting',
    'Инстанс запускается или не авторизован, подождите минуту.',
  ],
  [
    /custom webhook url is set/i,
    'webhookUrlSet',
    'Инстанс применяет настройки, приём сообщений возобновится автоматически.',
  ],
  [/contact info limit reached/i, 'checkLimited', STATUS_ERRORS[469]?.[1] ?? ''],
];

export function errorFromReason(reason: string, status?: number): GreenApiError | null {
  const match = REASON_ERRORS.find(([pattern]) => pattern.test(reason));
  return match ? new GreenApiError(match[1], match[2], { status, detail: reason }) : null;
}

function extractDetail(payload: string): string | undefined {
  try {
    const data: unknown = JSON.parse(payload);
    if (isRecord(data)) {
      const value = data.message ?? data.reason ?? data.description;
      return typeof value === 'string' ? value : undefined;
    }
  } catch {
    // ignore non-json
  }
  return (
    payload
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || undefined
  );
}

export function errorFromResponse(status: number, payload: string): GreenApiError {
  const detail = extractDetail(payload);
  const known = STATUS_ERRORS[status];
  if (known) return new GreenApiError(known[0], known[1], { status, detail });

  if (status >= 500) {
    return new GreenApiError('server', `GREEN-API временно недоступен (HTTP ${status}).`, {
      status,
      detail,
    });
  }
  return (
    (detail && errorFromReason(detail, status)) ||
    new GreenApiError('badRequest', `GREEN-API отклонил запрос (HTTP ${status}).`, {
      status,
      detail,
    })
  );
}
