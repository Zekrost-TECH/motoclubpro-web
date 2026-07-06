import { router } from '../../router';
import { setPageTitle } from '../../stores/router.store';
import { html, NixComponent } from '@deijose/nix-js';
import { myClubs, switchClub } from '../../stores/clubs.store';

export class ClubSelectorPage extends NixComponent {
    private router = router;

    onMount() {
        setPageTitle('Seleccionar Club');
    }

    async selectClub(clubId: string) {
        await switchClub(clubId);
        this.router.navigate('/dashboard');
    }

    render() {
        return html`
        <div class="auth-page">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/nix-js-logo.png" alt="BikerOS" class="auth-logo" />
                    <h1>Selecciona tu Club</h1>
                    <p>Elige el club que quieres administrar</p>
                </div>
                <div class="club-list">
                    ${() => (myClubs.value || []).map(club => html`
                        <button class="club-card" @click=${() => this.selectClub(club.id)}>
                            <div class="club-card-icon">
                                <ion-icon name="people-circle-outline"></ion-icon>
                            </div>
                            <div class="club-card-info">
                                <h3>${club.name}</h3>
                                <p>${club.city || ''} ${club.department || ''}</p>
                            </div>
                            <span class="badge badge-${club.role || 'rider'}">${club.role || 'rider'}</span>
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    `)}
                </div>
            </div>
        </div>
    `;
    }
}
