import type { InstanceSettings, YesNo } from './types';

export const HTTP_API_SETTINGS: Readonly<Partial<InstanceSettings>> = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
};

const SETTING_KEYS = Object.keys(HTTP_API_SETTINGS) as Array<keyof InstanceSettings>;

const yesNo = (value: unknown): YesNo => (value === 'yes' ? 'yes' : 'no');

export function parseInstanceSettings(data: Record<string, unknown>): InstanceSettings {
  return {
    webhookUrl: typeof data.webhookUrl === 'string' ? data.webhookUrl : '',
    incomingWebhook: yesNo(data.incomingWebhook),
    outgoingWebhook: yesNo(data.outgoingWebhook),
    outgoingAPIMessageWebhook: yesNo(data.outgoingAPIMessageWebhook),
    outgoingMessageWebhook: yesNo(data.outgoingMessageWebhook),
    stateWebhook: yesNo(data.stateWebhook),
  };
}

export function receptionDisabled(current: InstanceSettings): boolean {
  return current.webhookUrl !== '' || current.incomingWebhook !== 'yes';
}

export function httpApiSettingsPatch(current: InstanceSettings): Partial<InstanceSettings> | null {
  const changed = SETTING_KEYS.filter((key) => current[key] !== HTTP_API_SETTINGS[key]);
  if (changed.length === 0) return null;
  return Object.fromEntries(changed.map((key) => [key, HTTP_API_SETTINGS[key]]));
}
