import type { Credentials } from '@shared/api';
import { isRecord, readJson, removeItem, STORAGE_PREFIX, writeJson } from '@shared/lib';

const CREDENTIALS_KEY = `${STORAGE_PREFIX}credentials`;

function asIdentifier(value: unknown): string | null {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value ? value : null;
}

export function loadCredentials(): Credentials | null {
  const data = readJson(CREDENTIALS_KEY);
  if (!isRecord(data)) return null;

  const idInstance = asIdentifier(data.idInstance);
  const apiTokenInstance = asIdentifier(data.apiTokenInstance);
  if (!idInstance || !apiTokenInstance) return null;

  return {
    apiUrl: typeof data.apiUrl === 'string' ? data.apiUrl : '',
    idInstance,
    apiTokenInstance,
  };
}

export function saveCredentials(credentials: Credentials | null): void {
  if (credentials) writeJson(CREDENTIALS_KEY, credentials);
  else removeItem(CREDENTIALS_KEY);
}
