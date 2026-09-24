import type { ComponentProps } from 'react';
import { classNames } from '@shared/lib';
import s from './Button.module.css';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary';
  block?: boolean;
}

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
        variant === 'primary' ? s.primary : s.secondary,
        block && s.block,
        className,
      )}
    />
  );
}
