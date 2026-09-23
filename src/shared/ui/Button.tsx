import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@shared/lib';
import s from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary — акцентная заливка, ghost — нейтральный фон */
  variant?: 'primary' | 'ghost';
  /** растянуть кнопку на всю ширину контейнера */
  block?: boolean;
}

/** Базовая кнопка интерфейса */
export function Button({
  variant = 'primary',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classNames(
        s.root,
        variant === 'primary' ? s.primary : s.ghost,
        block && s.block,
        className,
      )}
    />
  );
}
