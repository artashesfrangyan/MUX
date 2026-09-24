import type { Credentials } from '../types';

export const DEMO_API_URL = 'demo://local';

export const DEMO_CREDENTIALS: Readonly<Credentials> = {
  apiUrl: DEMO_API_URL,
  idInstance: '1100000000',
  apiTokenInstance: 'demo',
};

export function isDemoApiUrl(apiUrl: string): boolean {
  return apiUrl.trim().toLowerCase() === DEMO_API_URL;
}

export function isDemoCredentials(credentials: Credentials): boolean {
  return isDemoApiUrl(credentials.apiUrl);
}
