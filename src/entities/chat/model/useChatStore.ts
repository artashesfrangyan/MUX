import { useEffect, useReducer, type Dispatch } from 'react';
import { loadChatStore, saveChatStore } from './persistence';
import {
  chatStoreReducer,
  initialChatStoreState,
  type ChatStoreAction,
  type ChatStoreState,
} from './store';

function hydrate(idInstance: string): ChatStoreState {
  return loadChatStore(idInstance) ?? initialChatStoreState;
}

export interface ChatStore {
  store: ChatStoreState;
  dispatch: Dispatch<ChatStoreAction>;
}

export function useChatStore(idInstance: string): ChatStore {
  const [store, dispatch] = useReducer(chatStoreReducer, idInstance, hydrate);

  useEffect(() => {
    saveChatStore(idInstance, store);
  }, [idInstance, store]);

  return { store, dispatch };
}
