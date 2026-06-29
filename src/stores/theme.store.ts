import { createStore, persistPlugin } from '@deijose/nix-js';

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
            persistPlugin<{ theme: Theme }>('mc:theme', { storage: localStorage }),
        ],
    }
);

export function applyTheme(): void {
    document.documentElement.setAttribute('data-theme', themeStore.theme.value);
}

export const { theme, setTheme, toggleTheme } = themeStore;
