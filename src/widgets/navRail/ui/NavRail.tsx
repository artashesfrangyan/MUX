import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ConnectionStatus } from '@shared/types';
import { classNames } from '@shared/lib';
import s from './NavRail.module.css';

export type NavFolder = 'all' | 'unread';

interface NavRailProps {
  folder: NavFolder;
  unreadTotal: number;
  connection: ConnectionStatus;
  idInstance: string;
  onSelectFolder: (folder: NavFolder) => void;
  onClearHistory: () => void;
  onLogout: () => void;
}

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  offline: 'нет соединения',
  connecting: 'подключение…',
  online: 'на связи',
  error: 'ошибка соединения',
};

const STATUS_CLASS: Record<ConnectionStatus, string | undefined> = {
  offline: undefined,
  connecting: s.statusConnecting,
  online: s.statusOnline,
  error: s.statusError,
};

function ChatsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.6c5.4 0 9.6 3.7 9.6 8.4 0 4.8-4.2 8.5-9.6 8.5-1.1 0-2.2-.16-3.2-.46l-4.1 2.3c-.6.34-1.3-.2-1.1-.86l.8-3.3a8.4 8.4 0 0 1-1.9-5.4c0-4.7 4.2-8.4 9.5-8.4Z"
      />
    </svg>
  );
}

function NewIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 6.6A2.6 2.6 0 0 1 5.6 4h3.2c.7 0 1.4.3 1.9.8l1 1c.34.33.8.52 1.28.52h5.4A2.6 2.6 0 0 1 21 8.9v8.5a2.6 2.6 0 0 1-2.6 2.6H5.6A2.6 2.6 0 0 1 3 17.4V6.6Z"
      />
    </svg>
  );
}

function ChannelsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 10.3c0-1 .8-1.8 1.8-1.8h3.5l8.8-3.7c.6-.25 1.3.2 1.3.85v12.7c0 .65-.7 1.1-1.3.85l-8.8-3.7H5.8c-1 0-1.8-.8-1.8-1.8v-3.4Zm1.9 5.2h1.4l1 4.3h3l-1-4.3H5.9Z"
      />
      <path fill="currentColor" d="M20.6 8.5h2.2v7h-2.2z" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3.6a4.2 4.2 0 0 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm7.2 2.2a3.2 3.2 0 0 1 0 6.4 3.2 3.2 0 0 1 0-6.4ZM2.2 19.4c0-3.4 3.2-5.7 6.8-5.7s6.8 2.3 6.8 5.7v.7H2.2v-.7Zm14.2-4.9c3 .3 5.4 2.3 5.4 5.1v.5h-4.2c0-2.2-.4-4.1-1.5-5.4.1 0 .2-.02.3-.02Z"
      />
    </svg>
  );
}

function CallsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.3 3.1l2.3.7c.6.2 1 .7 1.1 1.3l.2 2.4c0 .5-.2 1-.6 1.4l-1.2 1c.9 1.8 2.4 3.3 4.2 4.2l1-1.2c.3-.4.9-.6 1.4-.6l2.4.2c.6.1 1.1.5 1.3 1.1l.7 2.3c.2.8-.3 1.6-1.1 1.8-1.4.3-2.8.3-4.2-.1C9.4 17.2 5.2 13 3.8 7.6c-.4-1.4-.4-2.8-.1-4.2.2-.8 1-1.3 1.8-1.1Z"
      />
    </svg>
  );
}

function SettingsIcon() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {teeth.map((angle) => (
        <rect
          key={angle}
          x="10.7"
          y="0.9"
          width="2.6"
          height="5.2"
          rx="1.3"
          fill="currentColor"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="2.8" fill="none" />
    </svg>
  );
}

interface RailItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}

function RailItem({
  icon,
  label,
  active = false,
  badge = 0,
  disabled = false,
  title,
  onClick,
}: RailItemProps) {
  return (
    <button
      type="button"
      className={classNames(s.item, active && s.itemActive, disabled && s.itemDisabled)}
      disabled={disabled}
      title={title ?? label}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className={s.iconWrap}>
        {icon}
        {badge > 0 ? <span className={s.counter}>{badge > 99 ? '99+' : badge}</span> : null}
      </span>
      <span className={s.itemLabel}>{label}</span>
    </button>
  );
}

/**
 * Левая рельса навигации MAX: разделы чатов и «Настройки».
 * В поп-апе «Настройки» живут служебные действия прототипа — состояние
 * подключения к GREEN-API, очистка истории и выход из инстанса.
 */
export function NavRail({
  folder,
  unreadTotal,
  connection,
  idInstance,
  onSelectFolder,
  onClearHistory,
  onLogout,
}: NavRailProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <nav className={s.rail} aria-label="Разделы">
      <div className={s.topGroup}>
        <RailItem
          icon={<ChatsIcon />}
          label="Все"
          active={folder === 'all'}
          onClick={() => onSelectFolder('all')}
        />
        <RailItem
          icon={<NewIcon />}
          label="Новые"
          active={folder === 'unread'}
          badge={unreadTotal}
          onClick={() => onSelectFolder('unread')}
        />
        <RailItem
          icon={<ChannelsIcon />}
          label="Каналы"
          disabled
          title="Каналы недоступны в прототипе"
        />
        <div className={s.separator} />
        <RailItem
          icon={<ContactsIcon />}
          label="Контакты"
          disabled
          title="Контакты недоступны в прототипе"
        />
        <RailItem
          icon={<CallsIcon />}
          label="Звонки"
          disabled
          title="Звонки недоступны в прототипе"
        />
      </div>

      <div className={s.bottomGroup} ref={menuRef}>
        <RailItem
          icon={<SettingsIcon />}
          label="Настройки"
          active={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        />

        {menuOpen ? (
          <div className={s.menu} role="menu">
            <div className={s.menuHeader}>
              <div className={s.menuTitle}>Инстанс {idInstance}</div>
              <div className={s.menuSubtitle}>
                <span className={classNames(s.statusDot, STATUS_CLASS[connection])} />
                GREEN-API MAX · {CONNECTION_LABELS[connection]}
              </div>
            </div>
            <button type="button" className={s.menuItem} role="menuitem" onClick={onClearHistory}>
              Очистить историю чатов
            </button>
            <button
              type="button"
              className={classNames(s.menuItem, s.menuItemDanger)}
              role="menuitem"
              onClick={onLogout}
            >
              Отключить инстанс
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
