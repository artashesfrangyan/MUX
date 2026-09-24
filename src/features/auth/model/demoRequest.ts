import { STORAGE_PREFIX } from '@shared/lib';

const DEMO_PARAM = 'demo';
const DEMO_SESSION_KEY = `${STORAGE_PREFIX}demo`;

function demoInSession(): boolean {
  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDemoRequested(): boolean {
  return new URLSearchParams(window.location.search).has(DEMO_PARAM) || demoInSession();
}

export function rememberDemo(): void {
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, '1');
  } catch {
    return;
  }
}

export function clearDemoRequest(): void {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    return;
  }
  const url = new URL(window.location.href);
  if (!url.searchParams.has(DEMO_PARAM)) return;
  url.searchParams.delete(DEMO_PARAM);
  window.history.replaceState(window.history.state, '', url);
}
