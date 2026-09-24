import type { ReactNode } from 'react';
import s from './VisuallyHidden.module.css';

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={s.root}>{children}</span>;
}
