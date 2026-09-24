import type { Transport } from '../transport';
import { DEMO_CREDENTIALS } from './demoMode';
import { seedDemoHistory } from './demoSeed';
import { createMaxEmulator, type MaxEmulator } from './maxEmulator';

const DEMO_LATENCY_MS = 150;

let emulator: MaxEmulator | null = null;

function getEmulator(): MaxEmulator {
  if (!emulator) {
    emulator = createMaxEmulator({ idInstance: DEMO_CREDENTIALS.idInstance });
    seedDemoHistory(emulator);
  }
  return emulator;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const demoTransport: Transport = async (request) => {
  const { method, pathParam, query, body, signal } = request;

  if (method !== 'receiveNotification') await sleep(DEMO_LATENCY_MS);
  signal.throwIfAborted();

  const response = await getEmulator().handle({ method, pathParam, query, body, signal });
  signal.throwIfAborted();

  return {
    status: response.status,
    text: response.body === undefined ? '' : JSON.stringify(response.body),
  };
};

export function resetDemo(): void {
  emulator?.dispose();
  emulator = null;
}
