import { createContext } from 'react';

export type ToastKind = 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export type PushToast = (kind: ToastKind, text: string) => void;

export const ToastContext = createContext<PushToast | null>(null);
