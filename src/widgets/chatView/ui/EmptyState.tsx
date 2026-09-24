import { Wallpaper } from '@shared/ui';
import s from './ChatView.module.css';

/**
 * Пустое состояние MAX: чат не выбран, поэтому видна только область
 * с обоями — без карточек и подсказок, как в веб-клиенте MAX.
 */
export function EmptyState() {
  return (
    <section className={s.chatView}>
      <div className={s.body}>
        <Wallpaper />
      </div>
    </section>
  );
}
