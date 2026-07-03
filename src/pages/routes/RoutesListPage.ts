import { router } from '../../router';
import { html, NixComponent, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { openConfirm } from '../../components/ConfirmModal';
import { SkeletonCard } from '../../components/Skeleton';
import { formatEnum } from '../../utils/labels';
import { hasFeature } from '../../stores/plans.store';
import { createDebounced } from '../../utils/debounce';
import type { Route } from '../../types';
import { activeClub } from '../../stores/clubs.store';
import { setPageTitle } from '../../stores/router.store';

export class RoutesListPage extends NixComponent {
    search = createDebounced('', 300);
    private router = router;

    routesQuery = createQuery(
        'routes/list',
        () => api.routes.list(),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );

    deleteRoute = createCommand(
        'routes/delete',
        async (id: string) => api.routes.delete(id),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('routes/list'),
        }
    );

    onMount() {
        setPageTitle('Rutas');
        if (!hasFeature('route_library')) {
            this.router.navigate('/dashboard');
        }
    }

    filtered(): Route[] {
        let list = (this.routesQuery.data.value || []) as Route[];
        if (this.search.commit.value) {
            const q = this.search.commit.value.toLowerCase();
            list = list.filter((r) => r.name.toLowerCase().includes(q));
        }
        return list;
    }

    confirmDelete(id: string) {
        openConfirm('Eliminar Ruta', '¿Estás seguro de eliminar esta ruta?', () => {
            this.deleteRoute.execute(id);
        });
    }

    difficultyBadge(difficulty: string): string {
        switch (difficulty) {
            case 'suave': return 'badge-success';
            case 'moderado': return 'badge-warning';
            case 'expertos': return 'badge-danger';
            case 'viaje_largo': return 'badge-info';
            default: return 'badge';
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Rutas</h1>
                <p class="page-subtitle">Colección de caminos y recorridos del club</p>
            </div>
            <div class="page-header-actions">
                ${() => hasFeature('route_library') ? html`
                <button class="btn btn-primary" @click=${() => this.router.navigate('/routes/create')}>
                    <ion-icon name="add-outline"></ion-icon>
                    Nueva Ruta
                </button>` : ''}
            </div>
        </div>
        <div class="toolbar">
            <input type="text" class="input search-input" placeholder="Buscar ruta..."
                   value=${() => this.search.value.value} @input=${(e: any) => this.search.setValue(e.target.value)} />
            <div class="toolbar-spacer"></div>
            <span class="text-secondary">${() => this.filtered().length} rutas</span>
        </div>
        ${() => this.routesQuery.status.value === 'pending'
                ? html`<div class="cards-grid">${SkeletonCard()}${SkeletonCard()}${SkeletonCard()}</div>`
                : this.routesQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar rutas</div>`
                    : html`
                <div class="cards-grid">
                    ${() => {
                            const list = this.filtered();
                            if (!list.length) return html`<div class="empty"><ion-icon name="map-outline" class="empty-icon"></ion-icon><h4>No se encontraron rutas</h4><p>Crea la primera ruta del club.</p></div>`;
                            return repeat(list, (r: Route) => r.id, (r: Route) => html`
                        <div class="card" @click=${() => this.router.navigate(`/routes/${r.id}`)}>
                            <div class="card-header">
                                <h3>${r.name}</h3>
                                <span class=${`badge ${this.difficultyBadge(r.difficulty)}`}>${formatEnum(r.difficulty)}</span>
                            </div>
                            <div class="card-body">
                                <p>${r.description || 'Sin descripción'}</p>
                                <div class="card-meta">
                                    <span><ion-icon name="map-outline"></ion-icon> ${r.distance || r.distanceKm || 0} km</span>
                                    <span><ion-icon name="time-outline"></ion-icon> ${r.estimatedTime || '-'}</span>
                                    <span><ion-icon name="location-outline"></ion-icon> ${r.waypointsCount ?? r.waypoints_count ?? 0} paradas</span>
                                </div>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm btn-secondary" @click.stop=${() => this.router.navigate(`/routes/${r.id}/edit`)}>
                                    <ion-icon name="create-outline"></ion-icon> Editar
                                </button>
                                <button class="btn btn-sm btn-danger" @click.stop=${() => this.confirmDelete(r.id)}>
                                    <ion-icon name="trash-outline"></ion-icon> Eliminar
                                </button>
                            </div>
                        </div>
                    `);
                        }}
                </div>
            `}
    `;
    }
}
