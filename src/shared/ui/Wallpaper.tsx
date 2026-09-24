import type { CSSProperties } from 'react';
import patternUrl from '@shared/assets/pattern-space.svg';
import { classNames } from '@shared/lib';
import s from './Wallpaper.module.css';

export function Wallpaper() {
  return (
    <div className={s.wallpaper} aria-hidden="true">
      <div className={classNames(s.layer, s.base)} />
      <div
        className={classNames(s.layer, s.pattern)}
        style={{ '--pattern-url': `url(${patternUrl})` } as CSSProperties}
      />
    </div>
  );
}
