import { useCallback, useState } from 'react';

export interface ChatDrafts {
  drafts: Readonly<Record<string, string>>;
  setDraft: (chatId: string, text: string) => void;
}

export function useChatDrafts(): ChatDrafts {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const setDraft = useCallback((chatId: string, text: string) => {
    setDrafts(({ [chatId]: _previous, ...rest }) => (text ? { ...rest, [chatId]: text } : rest));
  }, []);

  return { drafts, setDraft };
}
