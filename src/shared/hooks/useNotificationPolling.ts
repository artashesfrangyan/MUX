import { useEffect, useEffectEvent } from 'react';
import {
  deleteNotification,
  GreenApiError,
  receiveNotification,
  type ConnectionStatus,
  type GreenApiErrorCode,
  type Credentials,
  type NotificationBody,
  type NotificationEnvelope,
} from '@shared/api';
import { backoffDelay } from '@shared/lib';

export interface PollingState {
  status: ConnectionStatus;
  error?: string;
  stopped?: boolean;
}

interface UseNotificationPollingOptions {
  credentials: Credentials | null;
  enabled: boolean;
  receiveTimeout?: number;
  onNotification: (body: NotificationBody) => void;
  onStatusChange: (state: PollingState) => void;
  restartToken?: number;
}

const POLL_GAP_MS = 300;
const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 30_000;
const PROBE_RECEIVE_TIMEOUT = 5;

const FATAL_ERROR_CODES: ReadonlySet<GreenApiErrorCode> = new Set(['unauthorized', 'forbidden']);

function describeFailure(error: unknown): Required<Pick<PollingState, 'error' | 'stopped'>> {
  const message =
    error instanceof Error && error.message ? error.message : 'Не удалось получить уведомления';
  const stopped = error instanceof GreenApiError && FATAL_ERROR_CODES.has(error.code);
  return { error: message, stopped };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function useNotificationPolling({
  credentials,
  enabled,
  receiveTimeout = 20,
  onNotification,
  onStatusChange,
  restartToken = 0,
}: UseNotificationPollingOptions): void {
  const emitNotification = useEffectEvent((body: NotificationBody) => {
    onNotification(body);
  });
  const emitStatus = useEffectEvent((state: PollingState) => {
    onStatusChange(state);
  });

  const apiUrl = credentials?.apiUrl ?? '';
  const idInstance = credentials?.idInstance ?? '';
  const apiTokenInstance = credentials?.apiTokenInstance ?? '';

  useEffect(() => {
    if (!enabled || !idInstance || !apiTokenInstance) return undefined;

    const activeCredentials: Credentials = { apiUrl, idInstance, apiTokenInstance };
    const controller = new AbortController();
    const { signal } = controller;

    const handle = async (envelope: NotificationEnvelope): Promise<void> => {
      try {
        emitNotification(envelope.body);
      } catch (error) {
        console.error('Не удалось обработать уведомление GREEN-API', envelope, error);
      }
      try {
        await deleteNotification(activeCredentials, envelope.receiptId);
      } catch {
        // ignore delete notification error
      }
    };

    const loop = async (): Promise<void> => {
      let healthy = false;
      let failures = 0;
      emitStatus({ status: 'connecting' });

      while (!signal.aborted) {
        try {
          const timeout = healthy ? receiveTimeout : PROBE_RECEIVE_TIMEOUT;
          const envelope = await receiveNotification(activeCredentials, timeout, signal);
          if (signal.aborted) return;

          failures = 0;
          if (!healthy) {
            healthy = true;
            emitStatus({ status: 'online' });
          }
          if (envelope) await handle(envelope);
          await sleep(POLL_GAP_MS, signal);
        } catch (error) {
          if (signal.aborted) return;

          healthy = false;
          const failure = describeFailure(error);
          emitStatus({ status: 'error', ...failure });
          if (failure.stopped) return;

          await sleep(
            backoffDelay(failures, { baseMs: RETRY_BASE_MS, maxMs: RETRY_MAX_MS }),
            signal,
          );
          failures += 1;
        }
      }
    };

    void loop();

    return () => {
      controller.abort();
    };
  }, [enabled, apiUrl, idInstance, apiTokenInstance, receiveTimeout, restartToken]);
}
