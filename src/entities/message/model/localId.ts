const LOCAL_ID_PREFIX = 'local-';

export function createLocalMessageId(): string {
  return `${LOCAL_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isLocalMessageId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX);
}
