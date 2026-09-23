import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

const MAX_LENGTH = 4000;

/** Поле ввода сообщения: Enter — отправить, Shift+Enter — новая строка */
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
    <div className="composer">
      <textarea
        ref={textareaRef}
        id="messageText"
        name="messageText"
        className="composer__input"
        placeholder={disabled ? 'Выберите чат, чтобы написать сообщение' : 'Написать сообщение…'}
        value={value}
        maxLength={MAX_LENGTH}
        rows={1}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="composer__send"
        disabled={!canSend}
        onClick={submit}
        title="Отправить (Enter)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.4-1.2 1.1L4 11l9 1-9 1-1.8 6.3c-.2.7.5 1.4 1.2 1.1z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
