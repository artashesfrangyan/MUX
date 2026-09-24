import type { ReactNode } from 'react';
import { classNames } from '@shared/lib';
import s from './Alert.module.css';

export type AlertTone = 'error' | 'warning' | 'info';

interface AlertProps {
  tone?: AlertTone;
  className?: string;
  children: ReactNode;
}

const TONE_CLASS: Record<AlertTone, string | undefined> = {
  error: s.error,
  warning: s.warning,
  info: s.info,
};

export function Alert({ tone = 'error', className, children }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={classNames(s.root, TONE_CLASS[tone], className)}
    >
      {children}
    </div>
  );
}
