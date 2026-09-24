import { avatarInitials } from './avatarInitials';
import s from './Avatar.module.css';

interface AvatarProps {
  id: string;
  title: string;
  size?: number;
}

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

function PersonGlyph({ size }: { size: number }) {
  const glyph = Math.round(size * 0.5);
  return (
    <svg width={glyph} height={glyph} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 12.2a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2Zm0 2.1c-4.4 0-8.2 2.2-8.2 5.1 0 .9.7 1.6 1.6 1.6h13.2c.9 0 1.6-.7 1.6-1.6 0-2.9-3.8-5.1-8.2-5.1Z"
      />
    </svg>
  );
}

export function Avatar({ id, title, size = 56 }: AvatarProps) {
  const [from, to] = PALETTE[hash(id) % PALETTE.length]!;
  const initials = avatarInitials(title);

  return (
    <span
      className={s.avatar}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        fontSize: Math.round(size * 0.36),
        lineHeight: `${Math.round(size * 0.36) + 2}px`,
      }}
      aria-hidden="true"
    >
      {initials ?? <PersonGlyph size={size} />}
    </span>
  );
}
