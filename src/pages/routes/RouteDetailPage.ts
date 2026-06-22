import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { MapView } from '../../components/MapView';

export function RouteDetailPage(routeId: string): NixTemplate {
    document.title = 'Detalle de Ruta | MotoClub Pro';
    const route = signal<any>(null);

    effect(() => {
        api.routes.get(routeId).then(r => route.update(() => r)).catch(() => { });
    });

    return html`
        <div class="page-header">
            <h2>${() => route.value?.name || 'Detalle de Ruta'}</h2>
            <div class="toolbar">
                <button class="btn" @click=${() => router.navigate('/routes')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
                <button class="btn btn-primary" @click=${() => router.navigate(`/routes/${routeId}/edit`)}>
                    <ion-icon name="create-outline"></ion-icon> Editar
                </button>
            </div>
        </div>
        ${() => {
            const r = route.value;
            if (!r) return html`<p class="empty">Cargando...</p>`;
            const waypoints = (r.waypoints || []).map((wp: any) => ({
                lat: Number(wp.lat) || 0,
                lng: Number(wp.lng) || 0,
                name: wp.name || '',
            }));
            return html`
                <div class="dashboard-card" style="margin-bottom:1.5rem;">
                    <div class="card-header"><h3>Mapa de la Ruta</h3></div>
                    <div class="card-body" style="padding:0;">
                        ${waypoints.length ? new MapView(waypoints) : html`<p class="empty">Sin waypoints para mostrar en el mapa.</p>`}
                    </div>
                </div>
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Información General</h3></div>
                        <div class="card-body">
                            <p><strong>Distancia:</strong> ${r.distance} km</p>
                            <p><strong>Tiempo Estimado:</strong> ${r.estimatedTime}</p>
                            <p><strong>Dificultad:</strong> <span class="badge">${r.difficulty}</span></p>
                            <p><strong>Descripción:</strong> ${r.description || '-'}</p>
                            ${r.elevationMin !== undefined ? html`<p><strong>Elevación Min:</strong> ${r.elevationMin} m</p>` : ''}
                            ${r.elevationMax !== undefined ? html`<p><strong>Elevación Max:</strong> ${r.elevationMax} m</p>` : ''}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Waypoints (${r.waypoints?.length || 0})</h3></div>
                        <div class="card-body">
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
            `;
        }}
    `;
}
