import { isRecord } from '@shared/lib';

export interface EmulatorRequest {
  method: string;
  pathParam?: string;
  query?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface EmulatorResponse {
  status: number;
  body?: unknown;
}

export interface EmulatorContact {
  phone: string;
  name: string;
}

interface Contact extends EmulatorContact {
  chatId: string;
}

interface SeedMessage {
  phone: string;
  text: string;
  idMessage?: string;
  timestamp?: number;
  delayMs?: number;
}

export interface MaxEmulator {
  handle: (request: EmulatorRequest) => Promise<EmulatorResponse>;
  addContact: (contact: EmulatorContact) => void;
  deliverIncoming: (message: SeedMessage) => void;
  deliverOutgoing: (message: SeedMessage & { status: 'delivered' | 'read' }) => void;
  dispose: () => void;
}

export interface MaxEmulatorOptions {
  idInstance?: string;
  echoDelayMs?: number;
  statusDelayMs?: number;
  replyDelayMs?: number;
}

export const NO_ACCOUNT_SUFFIX = '0000';

const WID = '79000000000@c.us';
const NAMES = ['Мария Кузнецова', 'Дмитрий Орлов', 'Екатерина Лебедева', 'Сергей Новиков'];
const REPLIES = [
  'Привет! Сообщение получено, спасибо.',
  'Отлично, договорились.',
  'Хорошо, сейчас посмотрю.',
];
const QUOTED_REPLY = 'Да, отвечаю именно на это сообщение.';

function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(value ^ text.charCodeAt(index), 0x01000193);
  }
  return value >>> 0;
}

export function chatIdForPhone(phone: string): string {
  return String(10_000_000 + (hash(phone) % 90_000_000));
}

let lastMessageId = 0;
function nextMessageId(): string {
  lastMessageId = Math.max(lastMessageId + 1, Date.now() * 1000);
  return String(lastMessageId);
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const ok = (body?: unknown): EmulatorResponse => ({ status: 200, body });
const invalid = (details: string): EmulatorResponse => ({
  status: 400,
  body: { message: `Validation failed. Details: ${details}` },
});
const textMessage = (text: string) => ({
  typeMessage: 'textMessage',
  textMessageData: { textMessage: text },
});

export function createMaxEmulator({
  idInstance = '1100000000',
  echoDelayMs = 300,
  statusDelayMs = 900,
  replyDelayMs = 2600,
}: MaxEmulatorOptions = {}): MaxEmulator {
  const queue: Array<{ receiptId: number; body: Record<string, unknown> }> = [];
  const waiters = new Set<() => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const contacts = new Map<string, Contact>();
  const checkedPhones = new Set<string>();
  let lastReceiptId = 0;
  let replyCount = 0;

  function later(ms: number, action: () => void) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      action();
    }, ms);
    timers.add(timer);
  }

  function notify(typeWebhook: string, fields: Record<string, unknown>, timestamp = nowSeconds()) {
    lastReceiptId += 1;
    queue.push({
      receiptId: lastReceiptId,
      body: {
        typeWebhook,
        instanceData: { idInstance: Number(idInstance), wid: WID, typeInstance: 'v3' },
        timestamp,
        ...fields,
      },
    });
    waiters.forEach((wake) => wake());
  }

  function contactByPhone(phone: string): Contact {
    const known = contacts.get(phone);
    if (known) return known;
    const contact = {
      phone,
      name: NAMES[hash(phone) % NAMES.length] ?? '',
      chatId: chatIdForPhone(phone),
    };
    contacts.set(phone, contact);
    return contact;
  }

  function contactByChatId(chatId: string): Contact {
    const known = [...contacts.values()].find((contact) => contact.chatId === chatId);
    return known ?? { phone: '', name: NAMES[0] ?? '', chatId };
  }

  const senderData = ({ chatId, name, phone }: Contact) => ({
    chatId,
    chatName: name,
    chatType: 'user',
    sender: chatId,
    senderName: name,
    senderPhoneNumber: phone ? Number(phone) : 0,
  });

  function reply(contact: Contact, quotedId: string) {
    replyCount += 1;
    const quoted = replyCount % 2 === 0;
    const messageData = quoted
      ? {
          typeMessage: 'quotedMessage',
          extendedTextMessageData: { text: QUOTED_REPLY, stanzaId: quotedId, participant: WID },
        }
      : textMessage(REPLIES[(replyCount - 1) % REPLIES.length] ?? '');
    notify('incomingMessageReceived', {
      idMessage: nextMessageId(),
      senderData: senderData(contact),
      messageData,
    });
  }

  function sendMessage(body: unknown): EmulatorResponse {
    const chatId = isRecord(body) && typeof body.chatId === 'string' ? body.chatId : '';
    const message = isRecord(body) && typeof body.message === 'string' ? body.message : '';
    if (!/^-?\d{1,20}$/.test(chatId)) return invalid('chatId has invalid format');
    if (!message.trim()) return invalid('message is required');

    const idMessage = nextMessageId();
    const contact = contactByChatId(chatId);
    const status = (value: string) => () =>
      notify('outgoingMessageStatus', { chatId, idMessage, status: value, sendByApi: true });

    later(echoDelayMs, () =>
      notify('outgoingAPIMessageReceived', {
        idMessage,
        senderData: senderData(contact),
        messageData: textMessage(message),
      }),
    );
    later(statusDelayMs, status('delivered'));
    later(statusDelayMs * 2, status('read'));
    later(Math.max(replyDelayMs, statusDelayMs * 2 + 200), () => reply(contact, idMessage));
    return ok({ idMessage });
  }

  function checkAccount(body: unknown): EmulatorResponse {
    const phone = isRecord(body) ? String(body.phoneNumber) : '';
    if (!/^(7\d{10}|375\d{9})$/.test(phone)) {
      return invalid('bad phone number, valid 11 or 12 digits');
    }
    const fromCache = isRecord(body) && body.force !== true && checkedPhones.has(phone);
    checkedPhones.add(phone);
    if (phone.endsWith(NO_ACCOUNT_SUFFIX)) return ok({ exist: false, chatId: '', fromCache });
    return ok({ exist: true, chatId: contactByPhone(phone).chatId, fromCache });
  }

  async function receiveNotification(query: Record<string, string> = {}, signal?: AbortSignal) {
    const seconds = Math.min(60, Math.max(5, Number(query.receiveTimeout) || 5));
    if (queue.length === 0 && !signal?.aborted) {
      await new Promise<void>((resolve) => {
        const finish = () => {
          clearTimeout(timer);
          waiters.delete(finish);
          resolve();
        };
        const timer = setTimeout(finish, seconds * 1000);
        waiters.add(finish);
        signal?.addEventListener('abort', finish, { once: true });
      });
    }

    return ok(queue[0]);
  }

  function deleteNotification(pathParam = ''): EmulatorResponse {
    const index = queue.findIndex((item) => String(item.receiptId) === pathParam);
    if (index === -1) return { status: 500, body: { message: 'findUnAckedMessage' } };
    queue.splice(index, 1);
    return ok({ result: true });
  }

  const settings = {
    webhookUrl: '',
    incomingWebhook: 'yes',
    outgoingWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    stateWebhook: 'yes',
  };

  function handle({ method, pathParam, query, body, signal }: EmulatorRequest) {
    switch (method.toLowerCase()) {
      case 'sendmessage':
        return Promise.resolve(sendMessage(body));
      case 'receivenotification':
        return receiveNotification(query, signal);
      case 'deletenotification':
        return Promise.resolve(deleteNotification(pathParam));
      case 'checkaccount':
        return Promise.resolve(checkAccount(body));
      case 'getstateinstance':
        return Promise.resolve(ok({ stateInstance: 'authorized' }));
      case 'getsettings':
        return Promise.resolve(ok({ ...settings, wid: WID, typeInstance: 'v3' }));
      case 'setsettings':
        if (isRecord(body)) Object.assign(settings, body);
        return Promise.resolve(ok({ saveSettings: true }));
      default:
        return Promise.resolve({ status: 404, body: { message: `Unknown method ${method}` } });
    }
  }

  return {
    handle,
    addContact: ({ phone, name }) => {
      contacts.set(phone, { phone, name, chatId: chatIdForPhone(phone) });
    },
    deliverIncoming: ({ phone, text, idMessage = nextMessageId(), timestamp, delayMs = 0 }) => {
      const contact = contactByPhone(phone);
      later(delayMs, () =>
        notify(
          'incomingMessageReceived',
          { idMessage, senderData: senderData(contact), messageData: textMessage(text) },
          timestamp,
        ),
      );
    },
    deliverOutgoing: ({
      phone,
      text,
      idMessage = nextMessageId(),
      timestamp,
      delayMs = 0,
      status,
    }) => {
      const contact = contactByPhone(phone);
      later(delayMs, () => {
        notify(
          'outgoingMessageReceived',
          { idMessage, senderData: senderData(contact), messageData: textMessage(text) },
          timestamp,
        );
        notify('outgoingMessageStatus', { chatId: contact.chatId, idMessage, status }, timestamp);
      });
    },
    dispose: () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      waiters.forEach((wake) => wake());
      queue.length = 0;
    },
  };
}
