import { ToastProvider } from '@shared/ui';
import { useSession } from '@features/auth';
import { ChatPage } from '@pages/chat';
import { LoginPage } from '@pages/login';
import { ErrorBoundary } from './ErrorBoundary';
import s from './App.module.css';

function SessionRoot() {
  const { credentials, prefill, isDemo, instanceState, busy, error, login, startDemo, logout } =
    useSession();

  return (
    <div className={s.app}>
      {credentials ? (
        <ChatPage
          key={credentials.idInstance}
          credentials={credentials}
          isDemo={isDemo}
          instanceState={instanceState}
          onLogout={logout}
        />
      ) : (
        <LoginPage prefill={prefill} busy={busy} error={error} onLogin={login} onDemo={startDemo} />
      )}
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SessionRoot />
      </ToastProvider>
    </ErrorBoundary>
  );
}
