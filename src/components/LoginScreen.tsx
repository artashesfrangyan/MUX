import { useState, type FormEvent } from 'react';
import { DEFAULT_API_URL, normalizeApiUrl } from '../api/greenApi';
import type { Credentials } from '../types';

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
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">MAX</div>
        <h1 className="login__title">Вход в чат MAX</h1>
        <p className="login__subtitle">
          Введите параметры доступа инстанса из личного кабинета{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            GREEN-API
          </a>
          . Отправка и получение сообщений выполняются методами SendMessage и
          ReceiveNotification.
        </p>

        <label className="field" htmlFor="idInstance">
          <span className="field__label">idInstance</span>
          <input
            id="idInstance"
            name="idInstance"
            className="field__input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="110100001"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
          />
        </label>

        <label className="field" htmlFor="apiTokenInstance">
          <span className="field__label">apiTokenInstance</span>
          <span className="field__with-action">
            <input
              id="apiTokenInstance"
              name="apiTokenInstance"
              className="field__input"
              type={showToken ? 'text' : 'password'}
              autoComplete="off"
              placeholder="bde035edae3fc00bc116bd112297908d"
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
            />
            <button
              type="button"
              className="field__action"
              onClick={() => setShowToken((value) => !value)}
            >
              {showToken ? 'скрыть' : 'показать'}
            </button>
          </span>
        </label>

        <button
          type="button"
          className="login__advanced-toggle"
          onClick={() => setAdvanced((value) => !value)}
        >
          {advanced ? '▾' : '▸'} apiUrl инстанса
        </button>

        {advanced ? (
          <label className="field" htmlFor="apiUrl">
            <span className="field__label">apiUrl</span>
            <input
              id="apiUrl"
              name="apiUrl"
              className="field__input"
              placeholder={DEFAULT_API_URL}
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
            />
            <span className="field__hint">
              Скопируйте значение <b>apiUrl</b> из личного кабинета. Для большинства инстансов
              подходит {DEFAULT_API_URL}, но у MAX-инстансов бывает кластерный адрес вида
              https://3100.api.green-api.com
            </span>
          </label>
        ) : null}

        <label className="checkbox" htmlFor="configureInstance">
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

        <label className="checkbox" htmlFor="remember">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Запомнить параметры доступа в этом браузере</span>
        </label>

        {validation ? <div className="login__error">{validation}</div> : null}
        {error ? <div className="login__error">{error}</div> : null}

        <button type="submit" className="button button--primary button--block" disabled={busy}>
          {busy ? 'Подключаемся…' : 'Войти'}
        </button>

        <p className="login__footer">
          Инструкция по запуску и описание проекта — в файле README.md репозитория. Получение
          сообщений реализовано методом ReceiveNotification (long polling).
        </p>
      </form>
    </div>
  );
}
