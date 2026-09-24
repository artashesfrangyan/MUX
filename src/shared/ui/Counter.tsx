import { classNames } from '@shared/lib';
import { VisuallyHidden } from './VisuallyHidden';
import s from './Counter.module.css';

interface CounterProps {
  value: number;
  size?: 'small' | 'medium';
  label?: string;
  className?: string;
}

function formatCount(value: number): string {
  return value > 99 ? '99+' : String(value);
}

export function Counter({ value, size = 'medium', label, className }: CounterProps) {
  if (value <= 0) return null;

  return (
    <span className={classNames(s.counter, size === 'small' ? s.small : s.medium, className)}>
      {label ? <VisuallyHidden>{`${label}: `}</VisuallyHidden> : null}
      {formatCount(value)}
    </span>
  );
}
