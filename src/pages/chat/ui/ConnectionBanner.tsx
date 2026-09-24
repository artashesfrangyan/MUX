import type { ConnectionStatus } from '@shared/api';
import s from './ConnectionBanner.module.css';

interface ConnectionBannerProps {
  connection: ConnectionStatus;
  error: string | null;
  stopped: boolean;
  onReconnect: () => void;
  onLogout: () => void;
}

export function ConnectionBanner({
  connection,
  error,
  stopped,
  onReconnect,
  onLogout,
}: ConnectionBannerProps) {
  if (connection !== 'error') return null;

  return (
    <div className={s.banner} role="alert">
      <p className={s.text}>
        {stopped ? 'Доступ к инстансу отклонён' : 'Не удаётся получать сообщения'}
        {error ? <span className={s.details}>{error}</span> : null}
      </p>
      {stopped ? (
        <button type="button" className={s.action} onClick={onLogout}>
          Выйти
        </button>
      ) : (
        <button type="button" className={s.action} onClick={onReconnect}>
          Переподключиться
        </button>
      )}
    </div>
  );
}
