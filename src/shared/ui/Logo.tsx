import { classNames } from '@shared/lib';
import s from './Logo.module.css';

interface LogoProps {
  /** сторона квадрата в px; размер шрифта рассчитывается от него */
  size?: number;
  className?: string;
}

/** Логотип MAX */
export function Logo({ size = 40, className }: LogoProps) {
  return (
    <div
      className={classNames(s.root, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      aria-hidden="true"
    >
      MAX
    </div>
  );
}
