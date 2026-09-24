const STARTS_WITH_LETTER = /^\p{L}/u;

export function avatarInitials(title: string): string | null {
  const words = title.split(/\s+/u).filter((word) => STARTS_WITH_LETTER.test(word));
  if (words.length === 0) return null;
  return words
    .slice(0, 2)
    .map((word) => String.fromCodePoint(word.codePointAt(0) ?? 0))
    .join('')
    .toUpperCase();
}
