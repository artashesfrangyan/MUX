import { classNames } from '@shared/lib';
import type { Toast, ToastKind } from './ToastContext';
import s from './Toasts.module.css';

interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const KIND_CLASS: Record<ToastKind, string | undefined> = {
  error: s.toastError,
  warning: s.toastWarning,
  info: undefined,
};

export function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className={s.toasts} aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(s.toast, KIND_CLASS[toast.kind])}
          role={toast.kind === 'error' ? 'alert' : undefined}
        >
          <span className={s.toastText}>{toast.text}</span>
          <button
            type="button"
            className={s.toastClose}
            aria-label="Закрыть уведомление"
            onClick={() => onDismiss(toast.id)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
