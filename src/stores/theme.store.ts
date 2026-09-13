import { createStore, persistPlugin } from '@elurjs/core';
import { legacyAwareStorage } from '../utils/storage';

export type Theme = 'dark' | 'light';

export const themeStore = createStore(
    { theme: 'dark' as Theme },
    {
        name: 'theme',
        actions: (s) => ({
            setTheme: (theme: Theme) => { s.theme.value = theme; },
            toggleTheme: () => { s.theme.value = s.theme.value === 'dark' ? 'light' : 'dark'; },
        }),
        plugins: [
            persistPlugin<{ theme: Theme }>('bikeros_theme', { storage: legacyAwareStorage }),
        ],
    }
);

export function applyTheme(): void {
    document.documentElement.setAttribute('data-theme', themeStore.theme.value);
}

export const { theme, setTheme, toggleTheme } = themeStore;
