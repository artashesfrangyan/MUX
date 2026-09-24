import styles from './Avatar.module.css';

interface AvatarProps {
  /** стабильный идентификатор (chatId) — от него зависит цвет градиента */
  id: string;
  title: string;
  size?: number;
  online?: boolean;
}

/** Парные градиенты аватаров из темы MAX (avatar-*) */
const PALETTE: Array<[string, string]> = [
  ['#79bcff', '#4289ed'],
  ['#9b90fe', '#6746ec'],
  ['#bf97ff', '#526eff'],
  ['#ff48b6', '#e74aa6'],
  ['#ffb381', '#e5782d'],
  ['#1bd6e3', '#27a5c8'],
  ['#14e1d5', '#03c722'],
  ['#08d7f3', '#288fbe'],
  ['#da9ef1', '#9b90fe'],
  ['#abb7cc', '#7ab7e4'],
];

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
    return digits.slice(1, 3) || clean.slice(1, 3);
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

/** Круглый аватар с инициалами: градиент выбирается по chatId */
export function Avatar({ id, title, size = 56, online = false }: AvatarProps) {
  const [from, to] = PALETTE[hash(id) % PALETTE.length]!;

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: Math.round(size * 0.36),
        lineHeight: `${Math.round(size * 0.36) + 2}px`,
      }}
      aria-hidden="true"
    >
      <span>{initials(title)}</span>
      {online ? <i className={styles.online} /> : null}
    </div>
  );
}
