export const COMPACT_LAYOUT_QUERY = '(max-width: 767px)';
export const TOUCH_INPUT_QUERY = '(pointer: coarse)';

export function mediaQueryList(query: string): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}

export function matchesMedia(query: string): boolean {
  return mediaQueryList(query)?.matches ?? false;
}
