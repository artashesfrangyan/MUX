import type { CSSProperties } from 'react';
import patternUrl from '@shared/assets/pattern-space.svg';
import s from './Wallpaper.module.css';

/**
 * Фон чата MAX: градиент (`--chat-background`) и космический паттерн,
 * который накладывается поверх через mask-image (точно так же, как в веб-клиенте MAX).
 */
export function Wallpaper() {
  return (
    <div className={s.wallpaper} aria-hidden="true">
      <div className={`${s.layer} ${s.base}`} />
      <div
        className={`${s.layer} ${s.pattern}`}
        style={{ '--pattern-url': `url(${patternUrl})` } as CSSProperties}
      />
    </div>
  );
}
