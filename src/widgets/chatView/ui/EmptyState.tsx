import { Wallpaper } from '@shared/ui';
import s from './ChatView.module.css';

export function EmptyState() {
  return (
    <section className={s.chatView}>
      <div className={s.body}>
        <Wallpaper />
      </div>
    </section>
  );
}
