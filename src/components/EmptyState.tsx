interface EmptyStateProps {
  onNewChat: () => void;
}

/** Заглушка, когда чат не выбран */
export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <section className="chat-view chat-view--empty">
      <div className="empty-state">
        <div className="empty-state__logo">MAX</div>
        <h2 className="empty-state__title">Выберите чат</h2>
        <p className="empty-state__text">
          Создайте новый чат по номеру телефона получателя и отправьте первое сообщение — оно
          уйдёт в мессенджер MAX через GREEN-API.
        </p>
        <button type="button" className="button button--primary" onClick={onNewChat}>
          Новый чат
        </button>
      </div>
    </section>
  );
}
