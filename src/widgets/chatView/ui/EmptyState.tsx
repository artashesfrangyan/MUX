import { Button, Logo } from '@shared/ui';
import { classNames } from '@shared/lib';
import s from './ChatView.module.css';

interface EmptyStateProps {
  onNewChat: () => void;
}

/** Заглушка, когда чат не выбран */
export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <section className={classNames(s.chatView, s.chatViewEmpty)}>
      <div className={s.emptyState}>
        <Logo size={74} className={s.emptyLogo} />
        <h2 className={s.emptyTitle}>Выберите чат</h2>
        <p className={s.emptyText}>
          Создайте новый чат по номеру телефона получателя и отправьте первое сообщение — оно
          уйдёт в мессенджер MAX через GREEN-API.
        </p>
        <Button onClick={onNewChat}>Новый чат</Button>
      </div>
    </section>
  );
}
