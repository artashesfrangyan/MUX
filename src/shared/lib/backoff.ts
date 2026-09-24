export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
  random?: () => number;
}

export function backoffDelay(
  attempt: number,
  { baseMs, maxMs, random = Math.random }: BackoffOptions,
): number {
  const ceiling = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  return Math.round(ceiling / 2 + (random() * ceiling) / 2);
}
