import { useEffect, useEffectEvent, useId, useRef, type ReactNode, type RefObject } from 'react';
import s from './Dialog.module.css';

interface DialogProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Dialog({ title, description, onClose, initialFocusRef, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const requestClose = useEffectEvent(() => onClose());

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    openerRef.current ??= document.activeElement;
    if (!dialog.open) dialog.showModal();
    initialFocusRef?.current?.focus();

    let pressedOnBackdrop = false;
    const handlePointerDown = (event: PointerEvent) => {
      pressedOnBackdrop = event.target === dialog;
    };
    const handleClick = (event: MouseEvent) => {
      if (pressedOnBackdrop && event.target === dialog) requestClose();
    };
    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('click', handleClick);

    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('click', handleClick);
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}

      onClose={onClose}
    >
      <div className={s.content}>
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className={s.description}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </dialog>
  );
}
