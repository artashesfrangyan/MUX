import {
  describeInstanceState,
  getSettings,
  getStateInstance,
  httpApiSettingsPatch,
  receptionDisabled,
  setSettings,
  type Credentials,
  type InstanceState,
} from '@shared/api';

export interface LoginNotice {
  kind: 'info' | 'warning';
  text: string;
}

export type ConnectResult =
  { ok: true; state: InstanceState; notices: LoginNotice[] } | { ok: false; message: string };

export interface ConnectOptions {
  configureInstance: boolean;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Не удалось подключиться к GREEN-API';
}

async function ensureHttpApiSettings(
  credentials: Credentials,
  configureInstance: boolean,
): Promise<LoginNotice | null> {
  try {
    const current = await getSettings(credentials);
    const patch = httpApiSettingsPatch(current);
    if (!patch) return null;

    if (!configureInstance) {
      if (!receptionDisabled(current)) return null;
      return {
        kind: 'warning',
        text: 'Приём сообщений выключен в настройках инстанса, ответы не будут приходить.',
      };
    }

    await setSettings(credentials, patch);
    return {
      kind: 'info',
      text: 'Приём сообщений включён, инстанс перезапустится в течение 5 минут.',
    };
  } catch (error) {
    return {
      kind: 'warning',
      text: `Не удалось проверить настройки приёма сообщений: ${errorText(error)}`,
    };
  }
}

export async function connectInstance(
  credentials: Credentials,
  { configureInstance }: ConnectOptions,
): Promise<ConnectResult> {
  let state: InstanceState;
  try {
    ({ stateInstance: state } = await getStateInstance(credentials));
  } catch (error) {
    return { ok: false, message: errorText(error) };
  }

  const stateInfo = describeInstanceState(state);
  if (stateInfo.level === 'error') return { ok: false, message: stateInfo.text };

  const notices: LoginNotice[] = [];
  if (stateInfo.level !== 'ok') notices.push({ kind: stateInfo.level, text: stateInfo.text });

  const settingsNotice = await ensureHttpApiSettings(credentials, configureInstance);
  if (settingsNotice) notices.push(settingsNotice);

  return { ok: true, state, notices };
}
