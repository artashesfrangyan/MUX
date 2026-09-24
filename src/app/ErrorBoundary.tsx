import { Component, type ErrorInfo, type ReactNode } from 'react';
import { removeItemsByPrefix, STORAGE_PREFIX } from '@shared/lib';
import { Button, Logo } from '@shared/ui';
import s from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Ошибка рендера приложения', error, info.componentStack);
  }

  private readonly reload = () => {
    window.location.reload();
  };

  private readonly resetLocalData = () => {
    removeItemsByPrefix(STORAGE_PREFIX);
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={s.root}>
        <div className={s.card} role="alert">
          <Logo size={58} className={s.logo} />
          <h1 className={s.title}>Что-то пошло не так</h1>
          <p className={s.text}>Попробуйте перезагрузить страницу.</p>
          <p className={s.text}>
            Если не помогло, сбросьте локальные данные: история и вход удалятся с этого устройства.
          </p>
          {error.message ? <p className={s.details}>{error.message}</p> : null}
          <div className={s.actions}>
            <Button onClick={this.reload}>Перезагрузить</Button>
            <Button variant="secondary" onClick={this.resetLocalData}>
              Сбросить локальные данные
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
