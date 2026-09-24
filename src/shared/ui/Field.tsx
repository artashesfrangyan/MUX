import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { classNames } from '@shared/lib';
import s from './Field.module.css';

interface FieldAction {
  label: string;
  title?: string;
  onClick: () => void;
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  action?: FieldAction;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ label, hint, error, action, id, ref, ...inputProps }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;
  const describedBy = classNames(inputProps['aria-describedby'], message ? messageId : null);

  const input = (
    <input
      ref={ref}
      className={s.input}
      id={inputId}
      {...inputProps}
      aria-describedby={describedBy || undefined}
    />
  );

  return (
    <div className={s.root}>
      <label className={s.label} htmlFor={inputId}>
        {label}
      </label>
      {action ? (
        <div className={s.withAction}>
          {input}
          <button type="button" className={s.action} title={action.title} onClick={action.onClick}>
            {action.label}
          </button>
        </div>
      ) : (
        input
      )}
      {message ? (
        <p id={messageId} className={classNames(s.hint, Boolean(error) && s.hintError)}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
