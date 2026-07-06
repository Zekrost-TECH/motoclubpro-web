import { signal } from '@deijose/nix-js';

export const routerPath = signal(window.location.pathname);
export const pageTitle = signal('BikerOS');

export function setPageTitle(title: string): void {
    const fullTitle = `${title} | BikerOS`;
    pageTitle.update(() => fullTitle);
    document.title = fullTitle;
}
