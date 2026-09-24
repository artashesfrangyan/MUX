export type TextPart =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

const LINK_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'«»]+/giu;
const TRAILING_PUNCTUATION = /[.,!?;:…]+$/u;

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

function trimTrailing(candidate: string): string {
  let result = candidate.replace(TRAILING_PUNCTUATION, '');
  while (result.endsWith(')') && count(result, '(') < count(result, ')')) {
    result = result.slice(0, -1).replace(TRAILING_PUNCTUATION, '');
  }
  return result;
}

export function toSafeHref(text: string): string | null {
  const withProtocol = /^www\./iu.test(text) ? `https://${text}` : text;
  try {
    const url = new URL(withProtocol);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;

  const pushText = (value: string) => {
    if (!value) return;
    const last = parts.at(-1);
    if (last?.kind === 'text') last.text += value;
    else parts.push({ kind: 'text', text: value });
  };

  for (const match of text.matchAll(LINK_PATTERN)) {
    const candidate = trimTrailing(match[0]);
    const href = toSafeHref(candidate);
    if (!href) continue;

    pushText(text.slice(cursor, match.index));
    parts.push({ kind: 'link', text: candidate, href });
    cursor = match.index + candidate.length;
  }

  pushText(text.slice(cursor));
  return parts;
}
