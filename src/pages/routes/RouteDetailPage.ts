import { router } from '../../router';
import { html, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import type { Route } from '../../types';
import { MapView } from '../../components/MapView';
import { formatEnum } from '../../utils/labels';

export class RouteDetailPage extends NixComponent {
    private router = router;
    private routeId = this.router.params.value?.id || '';

    routeQuery = createQuery(
        'routes/detail',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay ruta seleccionada');
            return api.routes.get(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );

    onMount() {
        document.title = 'Detalle de Ruta | MotoClub Pro';
    }

    get route() { return this.routeQuery.data.value as Route | null; }

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
                <h1 class="page-title">${() => this.route?.name || 'Detalle de Ruta'}</h1>
                <p class="page-subtitle">${() => this.route ? `${this.route.distance} km · ${this.route.estimatedTime}` : ''}</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-secondary" @click=${() => this.router.navigate('/routes')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
                <button class="btn btn-primary" @click=${() => this.router.navigate(`/routes/${this.routeId}/edit`)}>
                    <ion-icon name="create-outline"></ion-icon> Editar
                </button>
            </div>
        </div>
        ${() => {
                const r = this.route;
                if (!r) return html`<div class="empty"><ion-icon name="map-outline" class="empty-icon"></ion-icon><h4>Cargando...</h4></div>`;
                const waypoints = (r.waypoints || []).map((wp: any) => ({
                    lat: Number(wp.lat) || 0,
                    lng: Number(wp.lng) || 0,
                    name: wp.name || '',
                }));
                return html`
                <div class="dashboard-card" style="margin-bottom:var(--mc-space-6);overflow:hidden;">
                    <div class="card-header"><h3><ion-icon name="map-outline"></ion-icon> Mapa de la Ruta</h3></div>
                    <div class="card-body" style="padding:0;">
                        ${waypoints.length ? new MapView(waypoints) : html`<div class="empty"><ion-icon name="map-outline" class="empty-icon"></ion-icon><h4>Sin waypoints para mostrar</h4></div>`}
                    </div>
                </div>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="information-circle-outline"></ion-icon> Información General</h3></div>
                        <div class="card-body">
                            <div class="stat-list">
                                <div class="stat-item"><span>Distancia</span><strong>${r.distance} km</strong></div>
                                <div class="stat-item"><span>Tiempo Estimado</span><strong>${r.estimatedTime}</strong></div>
                                <div class="stat-item"><span>Dificultad</span><strong><span class="badge ${this.difficultyBadge(r.difficulty)}">${formatEnum(r.difficulty)}</span></strong></div>
                                ${r.elevationMin !== undefined ? html`<div class="stat-item"><span>Elevación Min</span><strong>${r.elevationMin} m</strong></div>` : ''}
                                ${r.elevationMax !== undefined ? html`<div class="stat-item"><span>Elevación Max</span><strong>${r.elevationMax} m</strong></div>` : ''}
                            </div>
                            <p style="margin-top:var(--mc-space-4);color:var(--mc-text-secondary);">${r.description || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="location-outline"></ion-icon> Waypoints (${r.waypoints.length || 0})</h3></div>
                        <div class="card-body">
                            <div class="data-table-wrapper">
                                <table class="data-table">
                                    <thead><tr><th>Orden</th><th>Nombre</th><th>Tipo</th><th>Coordenadas</th></tr></thead>
                                    <tbody>
                                        ${() => {
                        const wps = r.waypoints || [];
                        if (!wps.length) return html`<tr><td colspan="4" class="empty">Sin waypoints registrados.</td></tr>`;
                        return wps.map((wp: any, idx: number) => html`
                                                <tr>
                                                    <td>${idx + 1}</td>
                                                    <td><strong>${wp.name}</strong></td>
                                                    <td><span class="badge">${wp.type}</span></td>
                                                    <td>${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}</td>
                                                </tr>
                                            `);
                    }}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }}
    `;
    }
}
