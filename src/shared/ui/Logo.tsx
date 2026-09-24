import { useId } from 'react';
import { classNames } from '@shared/lib';
import s from './Logo.module.css';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  const gradientId = useId();

  return (
    <svg
      className={classNames(s.root, className)}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="MAX"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="8"
          y1="4"
          x2="56"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#6d5cf6" />
          <stop offset="100%" stopColor="#4d8dff" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <path
        d="M32 14c10.5 0 19 7.4 19 16.5S42.5 47 32 47c-2.3 0-4.5-.4-6.5-1l-7.9 4.3c-1 .5-2.1-.4-1.8-1.5l1.4-6A15.4 15.4 0 0 1 13 30.5C13 21.4 21.5 14 32 14Z"
        fill="#fff"
      />
      <path
        d="M24 26.5c3.2 2.8 5.9 4.6 8 4.6s4.8-1.8 8-4.6"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
