import { useCallback, useSyncExternalStore } from 'react';
import { matchesMedia, mediaQueryList } from '@shared/lib';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = mediaQueryList(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => matchesMedia(query));
}
