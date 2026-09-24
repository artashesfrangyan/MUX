import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastKind } from './ToastContext';
import { Toasts } from './Toasts';

const TOAST_LIFETIME_MS = 9000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Set<number>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev, { id, kind, text }]);

      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer);
        dismiss(id);
      }, TOAST_LIFETIME_MS);
      timersRef.current.add(timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </ToastContext>
  );
}
