interface AvatarProps {
  /** стабильный идентификатор (chatId) — от него зависит цвет */
  id: string;
  title: string;
  size?: number;
  online?: boolean;
}

const PALETTE = ['#7b61ff', '#4d8dff', '#ff7a59', '#2ec27e', '#e94c89', '#f2a30f', '#21b5c7'];

function hash(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) % 100000;
  }
  return result;
}

function initials(title: string): string {
  const clean = title.trim();
  if (!clean) return '?';
  if (clean.startsWith('+')) {
    const digits = clean.replace(/\D/g, '');
    return digits.slice(0, 2) || clean.slice(1, 3);
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

import styles from './Avatar.module.css';

/** Круглый аватар с инициалами контакта */
export function Avatar({ id, title, size = 48, online = false }: AvatarProps) {
  const color = PALETTE[hash(id) % PALETTE.length]!;

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.36),
      }}
      aria-hidden="true"
    >
      <span>{initials(title)}</span>
      {online ? <i className={styles.online} /> : null}
    </div>
  );
}
