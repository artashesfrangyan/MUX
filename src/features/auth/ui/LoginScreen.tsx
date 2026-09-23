import { useState, type FormEvent } from 'react';
import { DEFAULT_API_URL, normalizeApiUrl } from '@shared/api';
import type { Credentials } from '@shared/types';
import { Button, Field, Logo } from '@shared/ui';
import s from './LoginScreen.module.css';

interface LoginScreenProps {
  initialCredentials: Credentials | null;
  busy: boolean;
  error: string | null;
  onSubmit: (
    credentials: Credentials,
    options: { remember: boolean; configureInstance: boolean },
  ) => void;
}

/** Экран входа: учётные данные инстанса GREEN-API (idInstance, apiTokenInstance, apiUrl) */
export function LoginScreen({ initialCredentials, busy, error, onSubmit }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState(initialCredentials?.idInstance ?? '');
  const [apiTokenInstance, setApiTokenInstance] = useState(
    initialCredentials?.apiTokenInstance ?? '',
  );
  const [apiUrl, setApiUrl] = useState(initialCredentials?.apiUrl || DEFAULT_API_URL);
  const [remember, setRemember] = useState(true);
  const [configureInstance, setConfigureInstance] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [advanced, setAdvanced] = useState(
    Boolean(initialCredentials?.apiUrl) && initialCredentials?.apiUrl !== DEFAULT_API_URL,
  );
  const [validation, setValidation] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const instance = idInstance.trim();
    const token = apiTokenInstance.trim();

    if (!instance || !/^\d+$/.test(instance)) {
      setValidation('idInstance — числовой идентификатор инстанса из личного кабинета GREEN-API.');
      return;
    }
    if (!token) {
      setValidation('Укажите apiTokenInstance — ключ доступа инстанса.');
      return;
    }

    setValidation(null);
    onSubmit(
      { apiUrl: normalizeApiUrl(apiUrl), idInstance: instance, apiTokenInstance: token },
      { remember, configureInstance },
    );
  };

  return (
    <div className={s.login}>
      <form className={s.card} onSubmit={submit}>
        <Logo size={58} className={s.logo} />
        <h1 className={s.title}>Вход в чат MAX</h1>
        <p className={s.subtitle}>
          Введите параметры доступа инстанса из личного кабинета{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            GREEN-API
          </a>
          . Отправка и получение сообщений выполняются методами SendMessage и
          ReceiveNotification.
        </p>

        <Field
          id="idInstance"
          name="idInstance"
          label="idInstance"
          inputMode="numeric"
          autoComplete="off"
          placeholder="110100001"
          value={idInstance}
          onChange={(event) => setIdInstance(event.target.value)}
        />

        <Field
          id="apiTokenInstance"
          name="apiTokenInstance"
          label="apiTokenInstance"
          type={showToken ? 'text' : 'password'}
          autoComplete="off"
          placeholder="bde035edae3fc00bc116bd112297908d"
          value={apiTokenInstance}
          onChange={(event) => setApiTokenInstance(event.target.value)}
          action={{
            label: showToken ? 'скрыть' : 'показать',
            onClick: () => setShowToken((value) => !value),
          }}
        />

        <button
          type="button"
          className={s.advancedToggle}
          onClick={() => setAdvanced((value) => !value)}
        >
          {advanced ? '▾' : '▸'} apiUrl инстанса
        </button>

        {advanced ? (
          <Field
            id="apiUrl"
            name="apiUrl"
            label="apiUrl"
            placeholder={DEFAULT_API_URL}
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            hint={
              <>
                Скопируйте значение <b>apiUrl</b> из личного кабинета. Для большинства инстансов
                подходит {DEFAULT_API_URL}, но у MAX-инстансов бывает кластерный адрес вида
                https://3100.api.green-api.com
              </>
            }
          />
        ) : null}

        <label className={s.checkbox} htmlFor="configureInstance">
          <input
            id="configureInstance"
            name="configureInstance"
            type="checkbox"
            checked={configureInstance}
            onChange={(event) => setConfigureInstance(event.target.checked)}
          />
          <span>
            Включить получение уведомлений через HTTP API (метод SetSettings: очистить webhookUrl и
            включить входящие/исходящие уведомления)
          </span>
        </label>

        <label className={s.checkbox} htmlFor="remember">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Запомнить параметры доступа в этом браузере</span>
        </label>

        {validation ? <div className={s.error}>{validation}</div> : null}
        {error ? <div className={s.error}>{error}</div> : null}

        <Button type="submit" block disabled={busy}>
          {busy ? 'Подключаемся…' : 'Войти'}
        </Button>

        <p className={s.footer}>
          Инструкция по запуску и описание проекта — в файле README.md репозитория. Получение
          сообщений реализовано методом ReceiveNotification (long polling).
        </p>
      </form>
    </div>
  );
}
