import type { ConnectionStatus } from '@shared/api';
import { classNames } from '@shared/lib';
import { SettingsPopover } from './SettingsPopover';
import s from './NavRail.module.css';

interface NavRailProps {
  variant: 'rail' | 'tabbar';
  connection: ConnectionStatus;
  idInstance: string;
  isDemo: boolean;
  onLogout: () => void;
}

export function NavRail({ variant, connection, idInstance, isDemo, onLogout }: NavRailProps) {
  return (
    <nav className={classNames(s.nav, variant === 'rail' ? s.rail : s.tabbar)} aria-label="Разделы">
      <span className={classNames(s.item, s.itemActive)} aria-current="page">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2.6c5.4 0 9.6 3.7 9.6 8.4 0 4.8-4.2 8.5-9.6 8.5-1.1 0-2.2-.16-3.2-.46l-4.1 2.3c-.6.34-1.3-.2-1.1-.86l.8-3.3a8.4 8.4 0 0 1-1.9-5.4c0-4.7 4.2-8.4 9.5-8.4Z"
          />
        </svg>
        <span className={s.itemLabel}>Чаты</span>
      </span>

      <SettingsPopover
        placement={variant === 'rail' ? 'right' : 'top'}
        connection={connection}
        idInstance={idInstance}
        isDemo={isDemo}
        onLogout={onLogout}
      />
    </nav>
  );
}
