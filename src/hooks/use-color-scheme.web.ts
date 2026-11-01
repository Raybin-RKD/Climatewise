import { useSyncExternalStore } from 'react';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function subscribeToColorScheme(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
  mediaQuery.addEventListener('change', onChange);

  return () => mediaQuery.removeEventListener('change', onChange);
}

function getColorSchemeSnapshot() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function getServerColorSchemeSnapshot() {
  return 'light';
}

export function useColorScheme() {
  return useSyncExternalStore(
    subscribeToColorScheme,
    getColorSchemeSnapshot,
    getServerColorSchemeSnapshot
  );
}
