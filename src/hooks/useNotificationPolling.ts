import { useEffect, useRef } from 'react';
import { receiveNotification, deleteNotification } from '../api/greenApi';
import type { ConnectionStatus, Credentials, NotificationBody } from '../types';

interface UseNotificationPollingOptions {
  credentials: Credentials | null;
  enabled: boolean;
  /** длительность long polling ReceiveNotification (5..60 сек) */
  receiveTimeout?: number;
  onNotification: (body: NotificationBody) => void;
  onStatusChange: (status: ConnectionStatus, errorMessage?: string) => void;
  /** изменение значения перезапускает цикл опроса */
  restartToken?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Циклический опрос очереди уведомлений GREEN-API по технологии HTTP API:
 * ReceiveNotification → обработка → DeleteNotification.
 *
 * Цикл живёт, пока компонент смонтирован и enabled = true, и останавливается
 * через AbortController (в том числе прерывая текущий long polling запрос).
 */
export function useNotificationPolling({
  credentials,
  enabled,
  receiveTimeout = 20,
  onNotification,
  onStatusChange,
  restartToken = 0,
}: UseNotificationPollingOptions): void {
  const onNotificationRef = useRef(onNotification);
  const onStatusChangeRef = useRef(onStatusChange);

  onNotificationRef.current = onNotification;
  onStatusChangeRef.current = onStatusChange;

  const apiUrl = credentials?.apiUrl ?? '';
  const idInstance = credentials?.idInstance ?? '';
  const apiTokenInstance = credentials?.apiTokenInstance ?? '';

  useEffect(() => {
    if (!enabled || !idInstance || !apiTokenInstance) return undefined;

    const activeCredentials: Credentials = { apiUrl, idInstance, apiTokenInstance };
    const controller = new AbortController();
    let cancelled = false;
    let announced = false;

    onStatusChangeRef.current('connecting');

    const loop = async (): Promise<void> => {
      while (!cancelled) {
        try {
          // первый запрос делаем коротким, чтобы быстрее показать статус соединения
          const timeout = announced ? receiveTimeout : 5;
          const envelope = await receiveNotification(activeCredentials, timeout, controller.signal);
          if (cancelled) return;

          if (!announced) {
            announced = true;
            onStatusChangeRef.current('online');
          }

          if (envelope) {
            onNotificationRef.current(envelope.body);
            // подтверждаем обработку, чтобы уведомление ушло из очереди
            try {
              await deleteNotification(activeCredentials, envelope.receiptId);
            } catch {
              // уведомление будет получено повторно — дубли отсекаются по idMessage
            }
          }

          await delay(300);
        } catch (error) {
          if (cancelled || controller.signal.aborted) return;
          const message =
            error instanceof Error ? error.message : 'Не удалось получить уведомления';
          onStatusChangeRef.current('error', message);
          await delay(5000);
        }
      }
    };

    void loop();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, apiUrl, idInstance, apiTokenInstance, receiveTimeout, restartToken]);
}
