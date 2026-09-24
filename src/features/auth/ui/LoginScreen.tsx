import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { DEFAULT_API_URL, type Credentials } from '@shared/api';
import { Alert, Button, Field, Logo, Wallpaper } from '@shared/ui';
import {
  LOGIN_FORM_FIELDS,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormField,
} from '../model/loginForm';
import type { LoginOptions } from '../model/useSession';
import s from './LoginScreen.module.css';

interface LoginScreenProps {
  prefill: Credentials | null;
  busy: boolean;
  error: string | null;
  onSubmit: (credentials: Credentials, options: LoginOptions) => void;
  onDemo: () => void;
}

export function LoginScreen({ prefill, busy, error, onSubmit, onDemo }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState(prefill?.idInstance ?? '');
  const [apiTokenInstance, setApiTokenInstance] = useState(prefill?.apiTokenInstance ?? '');
  const [apiUrl, setApiUrl] = useState(prefill?.apiUrl || DEFAULT_API_URL);
  const [remember, setRemember] = useState(true);
  const [configureInstance, setConfigureInstance] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [advanced, setAdvanced] = useState(
    Boolean(prefill?.apiUrl) && prefill?.apiUrl !== DEFAULT_API_URL,
  );
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const focusField = (field: LoginFormField) => {
    const input = formRef.current?.elements.namedItem(field);
    if (input instanceof HTMLInputElement) input.focus();
  };

  const clearError = (field: LoginFormField) => {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  const errorProps = (field: LoginFormField) => ({
    error: errors[field],
    'aria-invalid': errors[field] ? true : undefined,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateLoginForm({ idInstance, apiTokenInstance, apiUrl });
    if (!result.ok) {
      const firstInvalid = LOGIN_FORM_FIELDS.find((field) => result.errors[field]);

      flushSync(() => {
        setErrors(result.errors);
        if (result.errors.apiUrl) setAdvanced(true);
      });
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    setErrors({});
    onSubmit(result.credentials, { remember, configureInstance });
  };

  return (
    <div className={s.screen}>
      <Wallpaper />
      <main className={s.scroller}>
        <div className={s.card}>
          <Logo size={56} className={s.logo} />
          <h1 className={s.title}>Вход в чат MAX</h1>
          <p className={s.subtitle}>
            Введите параметры инстанса из{' '}
            <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
              личного кабинета GREEN-API
            </a>
            .
          </p>

          <form ref={formRef} noValidate onSubmit={submit}>
            <Field
              id="idInstance"
              name="idInstance"
              label="idInstance"
              inputMode="numeric"
              autoComplete="off"
              placeholder="3100123456"
              value={idInstance}
              onChange={(event) => {
                setIdInstance(event.target.value);
                clearError('idInstance');
              }}
              {...errorProps('idInstance')}
            />

            <Field
              id="apiTokenInstance"
              name="apiTokenInstance"
              label="apiTokenInstance"
              type={showToken ? 'text' : 'password'}
              autoComplete="off"
              placeholder="ключ доступа инстанса"
              value={apiTokenInstance}
              onChange={(event) => {
                setApiTokenInstance(event.target.value);
                clearError('apiTokenInstance');
              }}
              action={{
                label: showToken ? 'скрыть' : 'показать',
                onClick: () => setShowToken((value) => !value),
              }}
              {...errorProps('apiTokenInstance')}
            />

            <button
              type="button"
              className={s.advancedToggle}
              aria-expanded={advanced}
              onClick={() => setAdvanced((value) => !value)}
            >
              <span aria-hidden="true">{advanced ? '▾' : '▸'}</span> apiUrl инстанса
            </button>

            {advanced ? (
              <Field
                id="apiUrl"
                name="apiUrl"
                label="apiUrl"
                inputMode="url"
                placeholder={DEFAULT_API_URL}
                value={apiUrl}
                onChange={(event) => {
                  setApiUrl(event.target.value);
                  clearError('apiUrl');
                }}
                hint="Адрес API из личного кабинета, например https://3100.api.green-api.com"
                {...errorProps('apiUrl')}
              />
            ) : null}

            <div className={s.option}>
              <label className={s.checkbox} htmlFor="configureInstance">
                <input
                  id="configureInstance"
                  name="configureInstance"
                  type="checkbox"
                  checked={configureInstance}
                  aria-describedby="configureInstanceHint"
                  onChange={(event) => setConfigureInstance(event.target.checked)}
                />
                <span>Включить приём сообщений в настройках инстанса</span>
              </label>
              <p id="configureInstanceHint" className={s.optionHint}>
                Если он выключен, инстанс перезапустится (до 5 минут).
              </p>
            </div>

            <label className={s.checkbox} htmlFor="remember">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Запомнить на этом устройстве</span>
            </label>

            {error ? <Alert className={s.alert}>{error}</Alert> : null}

            <Button type="submit" block disabled={busy}>
              {busy ? 'Проверяем инстанс…' : 'Войти'}
            </Button>
          </form>

          <div className={s.divider}>или</div>

          <Button
            variant="secondary"
            block
            className={s.demoButton}
            disabled={busy}
            aria-describedby="demoHint"
            onClick={onDemo}
          >
            Попробовать демо-режим
          </Button>
          <p id="demoHint" className={s.demoHint}>
            Работает без GREEN-API на встроенном эмуляторе MAX.
          </p>
        </div>
      </main>
    </div>
  );
}
