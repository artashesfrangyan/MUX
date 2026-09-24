import { useCallback, useEffect, useEffectEvent } from 'react';
import { isRecord } from '@shared/lib';

interface ChatNavigationOptions {
  chatOpen: boolean;
  compact: boolean;
  onClose: () => void;
}

const CHAT_ENTRY_KEY = 'maxChatOpen';
const IGNORED_TARGETS = 'dialog, [role="dialog"], input, select';

function isChatEntry(state: unknown): boolean {
  return isRecord(state) && state[CHAT_ENTRY_KEY] === true;
}

export function useChatNavigation({ chatOpen, compact, onClose }: ChatNavigationOptions) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    if (!chatOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      if (event.target instanceof Element && event.target.closest(IGNORED_TARGETS)) return;
      close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen]);

  const chatScreen = compact && chatOpen;
  useEffect(() => {
    if (!chatScreen) return undefined;

    if (!isChatEntry(window.history.state)) {
      window.history.pushState({ [CHAT_ENTRY_KEY]: true }, '');
    }
    const handlePopState = (event: PopStateEvent) => {
      if (!isChatEntry(event.state)) close();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatScreen]);

  return useCallback(() => {
    if (isChatEntry(window.history.state)) window.history.back();
    else onClose();
  }, [onClose]);
}
