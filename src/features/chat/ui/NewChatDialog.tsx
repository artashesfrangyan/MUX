import { useEffect, useState, type FormEvent } from 'react';
import { checkAccount, GreenApiError } from '@shared/api';
import { formatPhone, isValidPhone, normalizePhone, phoneToChatId } from '@shared/lib';
import { Button, Field } from '@shared/ui';
import type { Credentials } from '@shared/types';
import s from './NewChatDialog.module.css';

export interface NewChatResult {
  chatId: string;
  title: string;
  phoneNumber: string;
  /** true — chatId получен методом CheckAccount, false — использован формат phoneNumber@c.us */
  resolvedViaApi: boolean;
}

interface NewChatDialogProps {
  credentials: Credentials;
  onClose: () => void;
  onCreate: (result: NewChatResult) => void;
  onError: (message: string) => void;
}

/** Диалог создания нового чата по номеру телефона получателя */
export function NewChatDialog({ credentials, onClose, onCreate, onError }: NewChatDialogProps) {
  const [phone, setPhone] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const digits = normalizePhone(phone);

    if (!digits || !isValidPhone(phone)) {
      setHint('Введите номер в международном формате: 11 цифр (РФ) или 12 цифр (РБ).');
      return;
    }

    setHint(null);
    setBusy(true);

    try {
      const result = await checkAccount(credentials, digits);

      if ('status' in result) {
        throw new GreenApiError(result.reason);
      }

      if (!result.exist || !result.chatId) {
        setHint(`На номере ${formatPhone(digits)} не зарегистрирован аккаунт MAX.`);
        return;
      }

      onCreate({
        chatId: result.chatId,
        title: formatPhone(digits),
        phoneNumber: digits,
        resolvedViaApi: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось проверить номер';
      const fallbackChatId = phoneToChatId(digits);
      onError(`CheckAccount недоступен (${message}). Чат создан по номеру, отправка пойдёт напрямую.`);
      onCreate({
        chatId: fallbackChatId,
        title: formatPhone(digits),
        phoneNumber: digits,
        resolvedViaApi: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.modal} role="dialog" aria-modal="true" aria-label="Новый чат">
      <div className={s.backdrop} onClick={onClose} />
      <form className={s.card} onSubmit={submit}>
        <h2 className={s.title}>Новый чат</h2>
        <p className={s.subtitle}>
          Введите номер телефона получателя в MAX. Номер будет проверен методом CheckAccount, и мы
          получим chatId для отправки сообщений.
        </p>

        <Field
          id="phoneNumber"
          name="phoneNumber"
          label="Номер телефона"
          type="tel"
          autoFocus
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={hint}
        />

        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Проверяем номер…' : 'Создать чат'}
          </Button>
        </div>
      </form>
    </div>
  );
}
