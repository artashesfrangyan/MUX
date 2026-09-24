export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export interface NotificationEnvelope {
  receiptId: number;
  body: NotificationBody;
}

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
  chatId?: string;
  status?: OutgoingMessageStatus;
  description?: string;
  stateInstance?: string;
  quotaData?: QuotaData;
}

export type OutgoingMessageStatus =
  'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup' | (string & {});

export interface SenderData {
  chatId: string;
  chatName?: string;
  chatType?: 'user' | 'group' | 'channel' | 'bot' | (string & {});
  sender?: string;
  senderName?: string;
  senderType?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface QuotedMessageRef {
  stanzaId?: string;
  participant?: string;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: {
    textMessage: string;
    isForwarded?: boolean;
    forwardingScore?: number;

    quotedMessage?: QuotedMessageRef;
  };
  extendedTextMessageData?: QuotedMessageRef & {
    text?: string;
    title?: string;
    description?: string;
  };
  quotedMessage?: QuotedMessageRef;
}

export interface QuotaData {
  method?: string;
  used?: number | string;
  total?: number | string;
  status?: string;
  description?: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResult {
  exist: boolean;
  chatId: string;
  fromCache: boolean;
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'starting'
  | 'blocked'
  | 'suspended'
  | 'pendingPassword'
  | (string & {});

export interface StateInstanceResponse {
  stateInstance: InstanceState;
}

export type YesNo = 'yes' | 'no';

export interface InstanceSettings {
  webhookUrl: string;
  incomingWebhook: YesNo;
  outgoingWebhook: YesNo;
  outgoingAPIMessageWebhook: YesNo;
  outgoingMessageWebhook: YesNo;
  stateWebhook: YesNo;
}

export type ConnectionStatus = 'offline' | 'connecting' | 'online' | 'error';
