import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { currentUser, logout } from '../../stores/auth.store';
import { activeClub, myClubs } from '../../stores/clubs.store';
import { switchClub } from '../../stores/clubs.store';
import { router } from '../../router';

export function TopBar(): NixTemplate {
    const user = currentUser.value;

    return html`
        <header class="topbar">
            <div class="topbar-left">
                <h1 class="page-title">${() => document.title}</h1>
            </div>
            <div class="topbar-right">
                ${() => myClubs.value.length > 1
            ? html`
                        <select class="club-selector" @change=${(e: any) => switchClub(e.target.value)}>
                            ${myClubs.value.map(c => html`
                                <option value=${c.id} ?selected=${activeClub.value?.id === c.id}>${c.name}</option>
                            `)}
                        </select>
                    ` : ''}
                <div class="user-menu">
                    <span class="user-name">${user?.name || user?.email}</span>
                    <span class="user-role">${user?.role || ''}</span>
                    <button class="btn-icon" @click=${() => { logout(); router.navigate('/login'); }} title="Cerrar sesión">
                        <ion-icon name="log-out-outline"></ion-icon>
                    </button>
                </div>
            </div>
        </header>
    `;
}
