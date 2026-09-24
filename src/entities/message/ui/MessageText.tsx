import { splitLinks } from '@shared/lib';

interface MessageTextProps {
  text: string;
  linkClassName?: string;
}

export function MessageText({ text, linkClassName }: MessageTextProps) {
  return splitLinks(text).map((part, index) =>
    part.kind === 'link' ? (
      <a
        key={index}
        className={linkClassName}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {part.text}
      </a>
    ) : (
      part.text
    ),
  );
}
