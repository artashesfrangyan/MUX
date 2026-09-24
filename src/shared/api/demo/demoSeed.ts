import type { MaxEmulator } from './maxEmulator';

export const DEMO_CONTACTS = {
  anna: { phone: '79161234567', name: 'Анна Смирнова' },
  igor: { phone: '79262345678', name: 'Игорь Волков' },
} as const;

export const DEMO_GREETING_DELAY_MS = 4000;

function at(now: Date, daysAgo: number, hours: number, minutes: number): number {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

export function seedDemoHistory(emulator: MaxEmulator, now = new Date()): void {
  const { anna, igor } = DEMO_CONTACTS;
  emulator.addContact(anna);
  emulator.addContact(igor);

  emulator.deliverIncoming({
    phone: igor.phone,
    idMessage: '1000000000001',
    text: 'Привет! Скинешь презентацию к завтрашней встрече?',
    timestamp: at(now, 1, 18, 40),
  });
  emulator.deliverOutgoing({
    phone: igor.phone,
    idMessage: '1000000000002',
    text: 'Да, вечером пришлю.',
    timestamp: at(now, 1, 18, 42),
    status: 'read',
  });
  emulator.deliverIncoming({
    phone: igor.phone,
    idMessage: '1000000000003',
    text: 'Спасибо!',
    timestamp: at(now, 1, 18, 43),
  });

  emulator.deliverIncoming({
    phone: anna.phone,
    idMessage: '1000000000004',
    text: 'Привет! Напишите мне что-нибудь — я сразу отвечу.',
    delayMs: DEMO_GREETING_DELAY_MS,
  });
}
