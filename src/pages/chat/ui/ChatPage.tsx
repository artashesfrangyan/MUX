import { useCallback, useMemo, useState } from 'react';
import type { Credentials, InstanceState } from '@shared/api';
import { useMediaQuery, useUnreadTitle } from '@shared/hooks';
import { classNames, COMPACT_LAYOUT_QUERY } from '@shared/lib';
import { countUnread, selectActiveChat, sortChatsByActivity, useChatStore } from '@entities/chat';
import { NewChatDialog, type NewChatResult } from '@features/chat';
import { useInboxSync } from '@features/inbox';
import { useMessaging } from '@features/messaging';
import { ChatView, EmptyState } from '@widgets/chatView';
import { NavRail } from '@widgets/navRail';
import { Sidebar } from '@widgets/sidebar';
import { useChatDrafts } from '../model/useChatDrafts';
import { useChatNavigation } from '../model/useChatNavigation';
import { ConnectionBanner } from './ConnectionBanner';
import { InstanceStateNotice } from './InstanceStateNotice';
import s from './ChatPage.module.css';

interface ChatPageProps {
  credentials: Credentials;
  isDemo: boolean;
  instanceState: InstanceState | null;
  onLogout: () => void;
}

export function ChatPage({
  credentials,
  isDemo,
  instanceState: checkedState,
  onLogout,
}: ChatPageProps) {
  const chatStore = useChatStore(credentials.idInstance);
  const { store, dispatch } = chatStore;
  const inbox = useInboxSync({ credentials, chatStore });
  const { handleSend, handleRetry } = useMessaging(credentials, dispatch);
  const { drafts, setDraft } = useChatDrafts();
  const compact = useMediaQuery(COMPACT_LAYOUT_QUERY);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const chats = useMemo(() => sortChatsByActivity(store.chats), [store.chats]);
  const unreadTotal = useMemo(() => countUnread(chats), [chats]);
  const activeChat = selectActiveChat(store);

  const instanceState = inbox.instanceState ?? checkedState;

  useUnreadTitle(unreadTotal);

  const closeChat = useCallback(() => dispatch({ type: 'setActive', chatId: null }), [dispatch]);
  const goBack = useChatNavigation({ chatOpen: activeChat !== null, compact, onClose: closeChat });

  const openNewChat = useCallback(() => setNewChatOpen(true), []);
  const closeNewChat = useCallback(() => setNewChatOpen(false), []);

  const selectChat = useCallback(
    (chatId: string) => dispatch({ type: 'setActive', chatId }),
    [dispatch],
  );

  const findChatIdByPhone = useCallback(
    (digits: string) =>
      Object.values(store.chats).find((chat) => chat.phoneNumber === digits)?.chatId ?? null,
    [store.chats],
  );

  const handleCreateChat = useCallback(
    (result: NewChatResult) => {
      dispatch({
        type: 'ensureChat',
        chatId: result.chatId,
        title: result.title,
        phoneNumber: result.phoneNumber,
        activate: true,
      });
      setNewChatOpen(false);
    },
    [dispatch],
  );

  const connectionBanner = (
    <ConnectionBanner
      connection={inbox.connection}
      error={inbox.connectionError}
      stopped={inbox.connectionStopped}
      onReconnect={inbox.reconnect}
      onLogout={onLogout}
    />
  );

  const nav = (
    <NavRail
      variant={compact ? 'tabbar' : 'rail'}
      connection={inbox.connection}
      idInstance={credentials.idInstance}
      isDemo={isDemo}
      onLogout={onLogout}
    />
  );

  const showList = !compact || !activeChat;

  return (
    <div className={s.page}>
      <div className={classNames(s.shell, compact && s.shellCompact)}>
        {compact ? null : nav}

        {showList ? (
          <Sidebar
            chats={chats}
            activeChatId={store.activeChatId}
            drafts={drafts}
            connecting={inbox.connection === 'connecting'}
            isDemo={isDemo}
            notice={<InstanceStateNotice state={instanceState} />}
            overlay={connectionBanner}
            onSelectChat={selectChat}
            onNewChat={openNewChat}
          />
        ) : null}

        {activeChat ? (
          <ChatView
            chat={activeChat}
            connection={inbox.connection}
            draft={drafts[activeChat.chatId] ?? ''}
            onDraftChange={setDraft}
            onSend={handleSend}
            onRetry={handleRetry}
            onBack={compact ? goBack : undefined}
            overlay={compact ? connectionBanner : undefined}
          />
        ) : compact ? null : (
          <EmptyState />
        )}

        {compact && showList ? nav : null}
      </div>

      {newChatOpen ? (
        <NewChatDialog
          credentials={credentials}
          findChatIdByPhone={findChatIdByPhone}
          onClose={closeNewChat}
          onCreate={handleCreateChat}
        />
      ) : null}
    </div>
  );
}
