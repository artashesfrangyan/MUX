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
    <div className="toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`}>
          <span className="toast__text">{toast.text}</span>
          <button
            type="button"
            className="toast__close"
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
