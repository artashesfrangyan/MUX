import styles from './Toasts.module.css';

export interface Toast {
  id: number;
  kind: 'error' | 'warning' | 'info';
  text: string;
}

interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

/** Всплывающие уведомления об ошибках и статусах подключения */
export function Toasts({ toasts, onDismiss }: ToastsProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toasts}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${toast.kind === 'error' ? styles.toastError : toast.kind === 'warning' ? styles.toastWarning : ''}`}>
          <span className={styles.toastText}>{toast.text}</span>
          <button
            type="button"
            className={styles.toastClose}
            aria-label="Закрыть"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
