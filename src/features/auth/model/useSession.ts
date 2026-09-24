import { useCallback, useEffect, useState } from 'react';
import {
  DEMO_CREDENTIALS,
  describeInstanceState,
  getStateInstance,
  GreenApiError,
  isAbortError,
  isDemoCredentials,
  resetDemo,
  type Credentials,
  type InstanceState,
} from '@shared/api';
import { useToast } from '@shared/ui';
import { connectInstance } from './connectInstance';
import { loadCredentials, saveCredentials } from './credentialsStorage';
import { clearDemoRequest, isDemoRequested, rememberDemo } from './demoRequest';

export interface LoginOptions {
  remember: boolean;
  configureInstance: boolean;
}

export interface Session {
  credentials: Credentials | null;
  prefill: Credentials | null;
  isDemo: boolean;
  instanceState: InstanceState | null;
  busy: boolean;
  error: string | null;
  login: (credentials: Credentials, options: LoginOptions) => Promise<void>;
  startDemo: () => Promise<void>;
  logout: () => void;
}

const DEMO_NOTICE = 'Демо-режим: вместо GREEN-API отвечает встроенный эмулятор.';

function restoreCredentials(): Credentials | null {
  if (!isDemoRequested()) return loadCredentials();
  rememberDemo();
  return { ...DEMO_CREDENTIALS };
}

function withoutToken(credentials: Credentials): Credentials {
  return { ...credentials, apiTokenInstance: '' };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}

export function useSession(): Session {
  const pushToast = useToast();
  const [restored] = useState(restoreCredentials);
  const [credentials, setCredentials] = useState<Credentials | null>(restored);
  const [prefill, setPrefill] = useState<Credentials | null>(
    restored && !isDemoCredentials(restored) ? restored : null,
  );
  const [instanceState, setInstanceState] = useState<InstanceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoLogin = credentials !== null && credentials === restored ? restored : null;
  useEffect(() => {
    if (!autoLogin) return undefined;
    const controller = new AbortController();

    getStateInstance(autoLogin, controller.signal).then(
      ({ stateInstance }) => {
        setInstanceState(stateInstance);
        const { level, text } = describeInstanceState(stateInstance);
        if (level !== 'ok') pushToast(level === 'info' ? 'info' : 'warning', text);
      },
      (reason: unknown) => {
        if (isAbortError(reason)) return;
        if (
          reason instanceof GreenApiError &&
          (reason.code === 'unauthorized' || reason.code === 'forbidden')
        ) {
          saveCredentials(null);
          setCredentials(null);
          setPrefill(withoutToken(autoLogin));
          setError(reason.message);
          return;
        }
        pushToast('warning', `Не удалось проверить состояние инстанса: ${errorText(reason)}`);
      },
    );

    return () => controller.abort();
  }, [autoLogin, pushToast]);

  const login = useCallback(
    async (next: Credentials, { remember, configureInstance }: LoginOptions) => {
      setBusy(true);
      setError(null);
      try {
        const result = await connectInstance(next, { configureInstance });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const demo = isDemoCredentials(next);

        if (demo) rememberDemo();
        else saveCredentials(remember ? next : null);
        setInstanceState(result.state);
        setCredentials(next);
        result.notices.forEach((notice) => pushToast(notice.kind, notice.text));
        if (demo) pushToast('info', DEMO_NOTICE);
      } finally {
        setBusy(false);
      }
    },
    [pushToast],
  );

  const startDemo = useCallback(
    () => login({ ...DEMO_CREDENTIALS }, { remember: false, configureInstance: false }),
    [login],
  );

  const logout = useCallback(() => {
    if (credentials && isDemoCredentials(credentials)) {
      resetDemo();
      clearDemoRequest();
    } else {
      saveCredentials(null);
      if (credentials) setPrefill(withoutToken(credentials));
    }
    setCredentials(null);
    setInstanceState(null);
    setError(null);
  }, [credentials]);

  return {
    credentials,
    prefill,
    isDemo: credentials !== null && isDemoCredentials(credentials),
    instanceState,
    busy,
    error,
    login,
    startDemo,
    logout,
  };
}
