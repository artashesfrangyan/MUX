import { use } from 'react';
import { ToastContext, type PushToast } from './ToastContext';

export function useToast(): PushToast {
  const push = use(ToastContext);
  if (!push) throw new Error('useToast() вызван вне <ToastProvider>');
  return push;
}
