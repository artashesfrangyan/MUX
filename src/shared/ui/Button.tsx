import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@shared/lib';
import s from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary — акцентная заливка, secondary — нейтральная, ghost — прозрачная */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** размер кнопки MAX: small 36px, medium 44px, large 52px */
  size?: 'small' | 'medium' | 'large';
  /** растянуть кнопку на всю ширину контейнера */
  block?: boolean;
}

const VARIANT_CLASS = {
  primary: s.primary,
  secondary: s.secondary,
  ghost: s.ghost,
} as const;

const SIZE_CLASS = {
  small: s.small,
  medium: s.medium,
  large: s.large,
} as const;

/** Базовая кнопка интерфейса в стиле MAX */
export function Button({
  variant = 'primary',
  size = 'large',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classNames(s.root, VARIANT_CLASS[variant], SIZE_CLASS[size], block && s.block, className)}
    />
  );
}
