import { useEffect, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from 'react';
import { classNames, matchesMedia, TOUCH_INPUT_QUERY } from '@shared/lib';
import s from './Composer.module.css';

export interface ComposerHandle {
  focus: () => void;
}

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  ref?: Ref<ComposerHandle>;
}

export const MESSAGE_MAX_LENGTH = 4000;
const MAX_INPUT_HEIGHT = 160;

function fitHeight(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT)}px`;
}

function isSendKey(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  if (event.key !== 'Enter' || event.shiftKey) return false;

  if (event.nativeEvent.isComposing || event.keyCode === 229) return false;

  return !matchesMedia(TOUCH_INPUT_QUERY);
}

export function Composer({ value, onChange, onSend, disabled, ref }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      },
    }),
    [],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) fitHeight(textarea);
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === 'undefined') return undefined;

    let width = textarea.clientWidth;
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return;
      width = textarea.clientWidth;
      fitHeight(textarea);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  const text = value.trim();
  const canSend = !disabled && text.length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    onChange('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSendKey(event)) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className={s.composer}>
      <div className={s.inner}>
        <textarea
          ref={textareaRef}
          id="messageText"
          name="messageText"
          className={s.input}
          aria-label="Сообщение"
          placeholder={disabled ? 'Нет соединения с GREEN-API' : 'Сообщение'}
          value={value}
          maxLength={MESSAGE_MAX_LENGTH}
          rows={1}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className={s.btnEnd}>
          <button
            type="button"
            className={classNames(s.roundButton, s.sendButton)}
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
