import { html, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { setPageTitle } from '../../stores/router.store';
import { router } from '../../router';
import { clubsStore } from '../../stores/clubs.store';
import type { Club } from '../../types';

export class AdminClubsPage extends NixComponent {
    clubsQuery = createQuery('admin/clubs', async () => {
        const res = await api.auth.clubs();
        return res.clubs || [];
    }, { staleTime: 60_000 });

    onMount() {
        setPageTitle('Gestión de Clubs');
    }

    enterClub(club: Club) {
        clubsStore.setActiveClub(club);
        router.navigate('/dashboard');
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Gestión de Clubs</h1>
                <p class="page-subtitle">Todos los clubs de la plataforma</p>
            </div>
        </div>
        <div class="data-table-wrapper">
            ${() => this.clubsQuery.status.value === 'pending'
                ? html`<p>Cargando clubs...</p>`
                : this.clubsQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar clubs</div>`
                    : html`
                    <table class="data-table">
                        <thead><tr><th>Nombre</th><th>Ciudad</th><th>Rol</th><th></th></tr></thead>
                        <tbody>
                            ${() => {
                            const clubs = this.clubsQuery.data.value || [];
                            if (!clubs.length) return html`<tr><td colspan="4" class="empty">No hay clubs registrados.</td></tr>`;
                            return clubs.map((c: Club) => html`
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.city || '-'}, ${c.department || '-'}</td>
                                    <td><span class="badge badge-info">${c.role || '—'}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" @click=${() => this.enterClub(c)}>
                                            Entrar
                                        </button>
                                    </td>
                                </tr>
                            `);
                        }}
                        </tbody>
                    </table>
                `}
        </div>
    `;
    }
}
