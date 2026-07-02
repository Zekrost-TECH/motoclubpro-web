import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { currentUser } from '../../stores/auth.store';
import { activeClub, myClubs } from '../../stores/clubs.store';
import { switchClub } from '../../stores/clubs.store';
import { toggleMobileMenu } from '../../stores/ui.store';
import { pageTitle } from '../../stores/router.store';

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function TopBar(): NixTemplate {
    const user = currentUser.value;

    return html`
        <header class="topbar">
            <div class="topbar-left">
                <button class="mobile-menu-toggle" @click=${toggleMobileMenu} aria-label="Abrir menú">
                    <ion-icon name="menu-outline"></ion-icon>
                </button>
                <h1 class="page-title">${() => pageTitle.value}</h1>
            </div>
            <div class="topbar-right">
                ${() => {
            const clubs = myClubs.value || [];
            return clubs.length > 1
                ? html`
                            <select class="club-selector" @change=${(e: any) => switchClub(e.target.value)}>
                                ${clubs.map(c => html`
                                    <option value=${c.id} selected=${activeClub.value?.id === c.id}>${c.name}</option>
                                `)}
                            </select>
                        `
                : html`<span class="text-secondary fw-600">${activeClub.value?.name || ''}</span>`;
        }}
                <div class="user-menu">
                    <div class="user-avatar">${getInitials(user?.name || user?.email)}</div>
                    <div>
                        <span class="user-name">${user?.name || user?.email}</span>
                        <span class="user-role">${user?.role || 'piloto'}</span>
                    </div>
                </div>
            </div>
        </header>
    `;
}
