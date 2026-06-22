import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { myClubs } from '../../stores/clubs.store';
import { switchClub } from '../../stores/clubs.store';
import { router } from '../../router';

export function ClubSelectorPage(): NixTemplate {
    document.title = 'Seleccionar Club | MotoClub Pro';
    async function selectClub(clubId: string) {
        await switchClub(clubId);
        router.navigate('/');
    }

    return html`
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/nix-js-logo.png" alt="MotoClub Pro" class="auth-logo" />
                    <h1>Selecciona tu Club</h1>
                    <p>Elige el club que quieres administrar</p>
                </div>
                <div class="club-list">
                    ${() => myClubs.value.map(club => html`
                        <button class="club-card" @click=${() => selectClub(club.id)}>
                            <div class="club-card-icon">
                                <ion-icon name="people-circle-outline"></ion-icon>
                            </div>
                            <div class="club-card-info">
                                <h3>${club.name}</h3>
                                <p>${club.city || ''} ${club.department || ''}</p>
                            </div>
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    `)}
                </div>
            </div>
        </div>
    `;
}
