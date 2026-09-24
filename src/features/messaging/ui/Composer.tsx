import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import s from './Composer.module.css';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const MAX_LENGTH = 4000;

/**
 * Поле ввода сообщения MAX: белая капсула радиуса 16px, кнопка «+» слева
 * и круглая кнопка отправки справа. Enter — отправить, Shift+Enter — новая строка.
 */
export function Composer({ disabled, onSend }: ComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const canSend = !disabled && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className={s.composer}>
      <div className={s.inner}>
        <div className={s.btn}>
          <button
            type="button"
            className={s.roundButton}
            disabled
            aria-label="Прикрепить файл"
            title="Вложения не поддерживаются: тестовое задание — только текстовые сообщения"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="messageText"
          name="messageText"
          className={s.input}
          placeholder={disabled ? 'Нет соединения с GREEN-API' : 'Сообщение'}
          value={value}
          maxLength={MAX_LENGTH}
          rows={1}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className={s.btnEnd}>
          <button
            type="button"
            className={`${s.roundButton} ${s.sendButton}`}
            disabled={!canSend}
            title="Отправить (Enter)"
            aria-label="Отправить сообщение"
            onClick={submit}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.4-1.2 1.1L4 11l9 1-9 1-1.8 6.3c-.2.7.5 1.4 1.2 1.1z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
