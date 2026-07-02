import { signal } from '@deijose/nix-js';

export const routerPath = signal(window.location.pathname);
export const pageTitle = signal('MotoClub Pro');

export function setPageTitle(title: string): void {
    const fullTitle = `${title} | MotoClub Pro`;
    pageTitle.update(() => fullTitle);
    document.title = fullTitle;
}
