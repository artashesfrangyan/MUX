import { normalizeApiUrl, type Credentials } from '@shared/api';

export type LoginFormValues = Credentials;

export type LoginFormField = keyof LoginFormValues;

export type LoginFormErrors = Partial<Record<LoginFormField, string>>;

export const LOGIN_FORM_FIELDS: readonly LoginFormField[] = [
  'idInstance',
  'apiTokenInstance',
  'apiUrl',
];

export type LoginFormResult =
  { ok: true; credentials: Credentials } | { ok: false; errors: LoginFormErrors };

function isHttpUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    return (protocol === 'https:' || protocol === 'http:') && hostname !== '';
  } catch {
    return false;
  }
}

export function validateLoginForm(values: LoginFormValues): LoginFormResult {
  const idInstance = values.idInstance.trim();
  const apiTokenInstance = values.apiTokenInstance.trim();
  const apiUrl = normalizeApiUrl(values.apiUrl);
  const errors: LoginFormErrors = {};

  if (!idInstance) {
    errors.idInstance = 'Укажите idInstance.';
  } else if (!/^\d+$/.test(idInstance)) {
    errors.idInstance = 'idInstance состоит только из цифр.';
  }
  if (!apiTokenInstance) {
    errors.apiTokenInstance = 'Укажите apiTokenInstance.';
  }
  if (!isHttpUrl(apiUrl)) {
    errors.apiUrl = 'Укажите адрес вида https://3100.api.green-api.com.';
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, credentials: { apiUrl, idInstance, apiTokenInstance } };
}
