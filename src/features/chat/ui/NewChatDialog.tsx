import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Credentials } from '@shared/api';
import { Alert, Button, Dialog, Field } from '@shared/ui';
import { useCreateChat, type NewChatResult } from '../model/useCreateChat';
import s from './NewChatDialog.module.css';

interface NewChatDialogProps {
  credentials: Credentials;
  findChatIdByPhone?: (digits: string) => string | null;
  onClose: () => void;
  onCreate: (result: NewChatResult) => void;
}

export function NewChatDialog({
  credentials,
  findChatIdByPhone,
  onClose,
  onCreate,
}: NewChatDialogProps) {
  const [phone, setPhone] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);
  const { state, submit, resetError } = useCreateChat({
    credentials,
    findChatIdByPhone,
    onCreate,
  });

  const checking = state.status === 'checking';
  const fieldError = state.status === 'invalid' ? state.message : null;

  useEffect(() => {
    if (fieldError) phoneRef.current?.focus();
  }, [fieldError]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(phone);
  };

  return (
    <Dialog
      title="Новый чат"
      description="Введите номер телефона собеседника в MAX."
      onClose={onClose}
      initialFocusRef={phoneRef}
    >
      <form noValidate onSubmit={handleSubmit}>
        <Field
          ref={phoneRef}
          id="phoneNumber"
          name="phoneNumber"
          label="Номер телефона"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            resetError();
          }}
          aria-invalid={fieldError ? true : undefined}
          error={fieldError}
        />

        {state.status === 'failed' ? (
          <div className={s.failure}>
            <Alert>{state.message}</Alert>
          </div>
        ) : null}

        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={checking}>
            {checking ? 'Проверяем…' : 'Создать чат'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
