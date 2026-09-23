/** Учётные данные инстанса GREEN-API (личный кабинет → инстанс → параметры доступа) */
export interface Credentials {
  /** apiUrl — хост API из личного кабинета, например https://api.green-api.com или https://3100.api.green-api.com */
  apiUrl: string;
  /** idInstance — уникальный номер инстанса */
  idInstance: string;
  /** apiTokenInstance — ключ доступа инстанса */
  apiTokenInstance: string;
}

/** Уведомление, полученное методом ReceiveNotification */
export interface NotificationEnvelope {
  receiptId: number;
  body: NotificationBody;
}

/** Входящее уведомление (вебхук) GREEN-API MAX (v3) */
export interface NotificationBody {
  typeWebhook: string;
  instanceData?: {
    idInstance?: number;
    wid?: string;
    typeInstance?: string;
  };
  timestamp?: number;
  idMessage?: string;
  senderData?: SenderData;
  messageData?: MessageData;
  /** для уведомлений типа outgoingMessageStatus */
  chatId?: string;
  status?: string;
  description?: string;
}

export interface SenderData {
  chatId: string;
  chatName?: string;
  chatType?: 'user' | 'group' | string;
  sender?: string;
  senderName?: string;
  senderType?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface MessageData {
  /** textMessage | extendedTextMessage | imageMessage | ... */
  typeMessage: string;
  textMessageData?: {
    textMessage: string;
    isForwarded?: boolean;
    forwardingScore?: number;
  };
  extendedTextMessageData?: {
    text?: string;
  };
}

/** Ответ метода SendMessage */
export interface SendMessageResponse {
  idMessage: string;
}

/** Ответ метода CheckAccount */
export type CheckAccountResponse =
  | { exist: true; chatId: string; fromCache: boolean }
  | { exist: false; chatId: string; fromCache: boolean }
  | { status: false; reason: string };

/** Ответ метода GetStateInstance */
export interface StateInstanceResponse {
  stateInstance: 'authorized' | 'notAuthorized' | 'starting' | 'blocked' | 'sleepMode' | string;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  /** idMessage из GREEN-API, для локальных сообщений — временный идентификатор */
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  outgoing: boolean;
  status: MessageStatus;
  /** текст ошибки, если сообщение не удалось отправить */
  error?: string;
}

export interface Chat {
  chatId: string;
  title: string;
  phoneNumber?: string;
  isGroup: boolean;
  messages: ChatMessage[];
  unread: number;
  lastActivity: number;
}

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';
