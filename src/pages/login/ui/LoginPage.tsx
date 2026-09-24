import type { Credentials } from '@shared/api';
import { LoginScreen, type LoginOptions } from '@features/auth';

interface LoginPageProps {
  prefill: Credentials | null;
  busy: boolean;
  error: string | null;
  onLogin: (credentials: Credentials, options: LoginOptions) => Promise<void>;
  onDemo: () => Promise<void>;
}

export function LoginPage({ prefill, busy, error, onLogin, onDemo }: LoginPageProps) {
  return (
    <LoginScreen
      prefill={prefill}
      busy={busy}
      error={error}
      onSubmit={(credentials, options) => void onLogin(credentials, options)}
      onDemo={() => void onDemo()}
    />
  );
}
