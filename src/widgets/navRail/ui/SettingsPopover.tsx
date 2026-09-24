import { useEffect, useId, useRef, useState } from 'react';
import type { ConnectionStatus } from '@shared/api';
import { classNames } from '@shared/lib';
import s from './NavRail.module.css';

interface SettingsPopoverProps {
  placement: 'right' | 'top';
  connection: ConnectionStatus;
  idInstance: string;
  isDemo: boolean;
  onLogout: () => void;
}

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  offline: 'нет соединения',
  connecting: 'соединение…',
  online: 'на связи',
  error: 'ошибка соединения',
};

const STATUS_CLASS: Record<ConnectionStatus, string | undefined> = {
  offline: undefined,
  connecting: s.statusConnecting,
  online: s.statusOnline,
  error: s.statusError,
};

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

export function SettingsPopover({
  placement,
  connection,
  idInstance,
  isDemo,
  onLogout,
}: SettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return undefined;

    const isInside = (target: EventTarget | null) =>
      target instanceof Node && container.contains(target);

    const handlePointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) setOpen(false);
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !isInside(event.relatedTarget)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('focusout', handleFocusOut);
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('focusout', handleFocusOut);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const runAndClose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className={s.settings} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={classNames(s.item, open && s.itemActive)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <SettingsIcon />
        <span className={s.itemLabel}>Настройки</span>
      </button>

      <div
        id={panelId}
        className={classNames(s.popover, placement === 'right' ? s.popoverRight : s.popoverTop)}
        hidden={!open}
      >
        <div className={s.popoverHeader}>
          <p className={s.popoverTitle}>Инстанс {idInstance}</p>
          <p className={s.popoverSubtitle}>
            <span
              className={classNames(s.statusDot, STATUS_CLASS[connection])}
              aria-hidden="true"
            />
            GREEN-API MAX · {CONNECTION_LABELS[connection]}
          </p>
          {isDemo ? <p className={s.demoNote}>Демо-режим: собеседники — эмулятор MAX</p> : null}
        </div>
        <button
          type="button"
          className={classNames(s.popoverItem, s.popoverItemDanger)}
          title="Инстанс GREEN-API останется подключён"
          onClick={runAndClose(onLogout)}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
