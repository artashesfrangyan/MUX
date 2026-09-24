import type { InstanceState } from './types';

export interface InstanceStateInfo {
  level: 'ok' | 'info' | 'warning' | 'error';
  text: string;
}

const STATES: Partial<Record<InstanceState, InstanceStateInfo>> = {
  authorized: { level: 'ok', text: 'Инстанс авторизован и готов к работе.' },
  starting: { level: 'info', text: 'Инстанс запускается, это может занять до 5 минут.' },
  notAuthorized: {
    level: 'error',
    text: 'Инстанс не авторизован в MAX: отсканируйте QR-код в личном кабинете GREEN-API.',
  },
  blocked: { level: 'error', text: 'Аккаунт MAX заблокирован.' },
  suspended: {
    level: 'warning',
    text: 'На аккаунте MAX временные ограничения: писать можно только тем, кто есть в контактах.',
  },
  pendingPassword: {
    level: 'error',
    text: 'Нужен пароль двухфакторной защиты MAX, введите его в личном кабинете GREEN-API.',
  },
};

export function describeInstanceState(state: InstanceState): InstanceStateInfo {
  const known = Object.hasOwn(STATES, state) ? STATES[state] : undefined;
  return (
    known ?? {
      level: 'warning',
      text: `Инстанс в состоянии «${state}», проверьте его в личном кабинете GREEN-API.`,
    }
  );
}
