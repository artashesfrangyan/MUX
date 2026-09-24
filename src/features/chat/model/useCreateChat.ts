import { useCallback, useEffect, useRef, useState } from 'react';
import { checkAccount, isAbortError, type Credentials } from '@shared/api';
import { formatPhone, normalizePhone } from '@shared/lib';

export interface NewChatResult {
  chatId: string;
  title: string;
  phoneNumber: string;
}

export type CreateChatState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'invalid'; message: string }
  | { status: 'failed'; message: string };

interface UseCreateChatOptions {
  credentials: Credentials;
  findChatIdByPhone?: (digits: string) => string | null;
  onCreate: (result: NewChatResult) => void;
}

export interface CreateChat {
  state: CreateChatState;
  submit: (phoneInput: string) => Promise<void>;
  resetError: () => void;
}

const INVALID_PHONE = 'Нужен российский (+7) или белорусский (+375) номер.';

export function useCreateChat({
  credentials,
  findChatIdByPhone,
  onCreate,
}: UseCreateChatOptions): CreateChat {
  const [state, setState] = useState<CreateChatState>({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = useCallback(
    async (phoneInput: string) => {
      const digits = normalizePhone(phoneInput);
      if (!digits) {
        setState({ status: 'invalid', message: INVALID_PHONE });
        return;
      }
      const title = formatPhone(digits);

      const existingChatId = findChatIdByPhone?.(digits);
      if (existingChatId) {
        onCreate({ chatId: existingChatId, title, phoneNumber: digits });
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ status: 'checking' });

      try {
        const { signal } = controller;
        let result = await checkAccount(credentials, digits, { signal });

        if (!result.exist && result.fromCache) {
          result = await checkAccount(credentials, digits, { force: true, signal });
        }

        if (!result.exist) {
          setState({ status: 'invalid', message: `Номер ${title} не зарегистрирован в MAX.` });
          return;
        }
        setState({ status: 'idle' });
        onCreate({ chatId: result.chatId, title, phoneNumber: digits });
      } catch (error) {
        if (isAbortError(error)) return;
        setState({
          status: 'failed',
          message: error instanceof Error ? error.message : 'Не удалось проверить номер.',
        });
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [credentials, findChatIdByPhone, onCreate],
  );

  const resetError = useCallback(() => {
    setState((current) =>
      current.status === 'invalid' || current.status === 'failed' ? { status: 'idle' } : current,
    );
  }, []);

  return { state, submit, resetError };
}
