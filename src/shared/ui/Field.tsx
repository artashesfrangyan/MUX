import type { InputHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@shared/lib';
import s from './Field.module.css';

interface FieldAction {
  label: string;
  title?: string;
  onClick: () => void;
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** подпись над полем */
  label: string;
  /** пояснение под полем */
  hint?: ReactNode;
  /** текст ошибки под полем: перекрывает hint и выделяется красным */
  error?: string | null;
  /** кнопка справа внутри поля, например «показать» пароль */
  action?: FieldAction;
}

/** Поле ввода с подписью, подсказкой и опциональной кнопкой-действием */
export function Field({ label, hint, error, action, id, ...inputProps }: FieldProps) {
  const input = <input className={s.input} id={id} {...inputProps} />;
  const message = error ?? hint;

  return (
    <label className={s.root} htmlFor={id}>
      <span className={s.label}>{label}</span>
      {action ? (
        <span className={s.withAction}>
          {input}
          <button
            type="button"
            className={s.action}
            title={action.title}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        </span>
      ) : (
        input
      )}
      {message ? (
        <span className={classNames(s.hint, Boolean(error) && s.hintError)}>{message}</span>
      ) : null}
    </label>
  );
}
