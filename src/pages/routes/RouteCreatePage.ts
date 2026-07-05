import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { RouteMapEditor } from '../../components/RouteMapEditor';
import { setPageTitle } from '../../stores/router.store';
import { hasFeature } from '../../stores/plans.store';
import type { Route } from '../../types';

export class RouteCreatePage extends NixComponent {
    name = signal('');
    description = signal('');
    difficulty = signal('suave');
    distance = signal(0);
    estimatedTime = signal('');
    startLat = signal<number | null>(null);
    startLng = signal<number | null>(null);
    startName = signal('');
    waypoints = signal<any[]>([]);
    pendingLat = signal<number | null>(null);
    pendingLng = signal<number | null>(null);
    _routeMapEditor = new RouteMapEditor();
    private router = router;

    updateWaypoint(index: number, field: string, value: any) {
        const list = [...this.waypoints.value];
        list[index] = { ...list[index], [field]: value };
        this.waypoints.update(() => list);
    }

    removeWaypoint(index: number) {
        const list = [...this.waypoints.value];
        list.splice(index, 1);
        this.waypoints.update(() => list);
        this._routeMapEditor.setWaypoints(this.waypoints.value);
    }

    createRoute = createCommand(
        'routes/create',
        async (payload: Partial<Route>) => api.routes.create(payload),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('routes/list'),
        }
    );

    onInit() {
        this._routeMapEditor.onWaypointsChange = (wps) => this.waypoints.update(() => wps);
        this._routeMapEditor.onPendingChange = (lat, lng) => {
            this.pendingLat.update(() => lat);
            this.pendingLng.update(() => lng);
        };
    }

    onMount() {
        setPageTitle('Nueva Ruta');
        if (!hasFeature('route_library')) {
            this.router.navigate('/dashboard');
        }
    }

    async handleSubmit() {
        try {
            const route = await this.createRoute.executeAsync({
                name: this.name.value,
                description: this.description.value,
                difficulty: this.difficulty.value as any,
                distance: Number(this.distance.value),
                estimatedTime: this.estimatedTime.value,
                startLat: this.startLat.value ?? undefined,
                startLng: this.startLng.value ?? undefined,
                startName: this.startName.value,
            }) as Route;
            if (route?.id && this.waypoints.value.length > 0) {
                const geojson = {
                    type: 'FeatureCollection',
                    features: this.waypoints.value.map((wp, idx) => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
                        properties: { name: wp.name, type: wp.type, sortOrder: idx },
                    })),
                };
                await api.routes.addBatchWaypoints(route.id, geojson);
            }
            showToast('Ruta creada exitosamente', 'success');
            this.router.navigate('/routes');
        } catch (err: any) {
            showToast(err.message || 'Error al crear ruta', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Nueva Ruta</h1>
                <p class="page-subtitle">Diseña un camino para las rodadas</p>
            </div>
        </div>
        <form class="form-card" @submit.prevent=${() => this.handleSubmit()}>
            <h3 class="form-section-title">Información de la ruta</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" value=${() => this.name.value} @input=${(e: any) => this.name.update(() => e.target.value)} placeholder="Ej. Ruta Costera a Tolú" required />
                </div>
                <div class="form-group">
                    <label>Dificultad</label>
                    <select value=${() => this.difficulty.value} @change=${(e: any) => this.difficulty.update(() => e.target.value)}>
                        <option value="suave">Suave</option>
                        <option value="off_road">Off Road</option>
                        <option value="viaje_largo">Viaje Largo</option>
                        <option value="expertos">Expertos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Distancia (km)</label>
                    <input type="number" value=${() => this.distance.value} @input=${(e: any) => this.distance.update(() => Number(e.target.value))} placeholder="120" required />
                </div>
                <div class="form-group">
                    <label>Tiempo Estimado</label>
                    <input type="text" value=${() => this.estimatedTime.value} @input=${(e: any) => this.estimatedTime.update(() => e.target.value)} placeholder="3h 30m" />
                </div>
            </div>
            <h3 class="form-section-title" style="margin-top:var(--mc-space-6);">Recorrido en Mapa</h3>
            <div style="margin-bottom:0.75rem;">
                ${this._routeMapEditor}
            </div>
            ${() => this.pendingLat.value != null && this.pendingLng.value != null ? html`
                <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
                    <button type="button" class="btn btn-sm btn-primary" @click=${() => this._routeMapEditor.confirmPending()}>
                        <ion-icon name="checkmark-outline"></ion-icon> Confirmar parada
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" @click=${() => this._routeMapEditor.clearPending()}>
                        <ion-icon name="close-outline"></ion-icon> Cancelar
                    </button>
                </div>
            ` : null}
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
                <button type="button" class="btn btn-sm btn-secondary" @click=${() => this._routeMapEditor.removeLast()} disabled=${() => this.waypoints.value.length === 0}>
                    <ion-icon name="arrow-undo-outline"></ion-icon> Deshacer última
                </button>
                <button type="button" class="btn btn-sm btn-danger" @click=${() => this._routeMapEditor.clearAll()} disabled=${() => this.waypoints.value.length === 0}>
                    <ion-icon name="close-circle-outline"></ion-icon> Limpiar todo
                </button>
            </div>
            <p class="help-text" style="font-size:0.85rem;color:var(--mc-text-muted);margin-bottom:1rem;">
                Haz clic en el mapa para colocar un marcador provisional, luego presiona <b>Confirmar parada</b>. Arrastra los marcadores para ajustar la posición.
            </p>
            <h3 class="form-section-title">Detalle de Paradas</h3>
            <div class="form-group">
                ${() => this.waypoints.value.map((wp: any, idx: number) => html`
                    <div class="form-grid" style="margin-top:0.5rem;padding:var(--mc-space-3);border:1px solid var(--mc-border);border-radius:var(--mc-radius-md);background:var(--mc-bg-panel);align-items:center;">
                        <div class="form-group" style="margin-bottom:0;">
                            <input type="text" value=${wp.name} @input=${(e: any) => this.updateWaypoint(idx, 'name', e.target.value)} placeholder="Nombre" />
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <select value=${wp.type} @change=${(e: any) => this.updateWaypoint(idx, 'type', e.target.value)}>
                                <option value="inicio">Inicio</option>
                                <option value="parada">Parada</option>
                                <option value="gasolinera">Gasolinera</option>
                                <option value="restaurante">Restaurante</option>
                                <option value="destino">Destino</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;text-align:right;">
                            <button type="button" class="btn btn-sm btn-danger" @click=${() => this.removeWaypoint(idx)}>
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </div>
                `)}
                ${() => !this.waypoints.value.length ? html`<div class="empty"><ion-icon name="location-outline" class="empty-icon"></ion-icon><h4>No hay paradas</h4><p>Haz clic en el mapa para agregar puntos al recorrido.</p></div>` : ''}
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="4" value=${() => this.description.value} @input=${(e: any) => this.description.update(() => e.target.value)} placeholder="Descripción del recorrido, puntos de interés, precauciones..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click=${() => this.router.navigate('/routes')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled=${() => this.createRoute.isPending.value}>
                    <ion-icon name="save-outline"></ion-icon>
                    ${() => this.createRoute.isPending.value ? 'Guardando...' : 'Crear Ruta'}
                </button>
            </div>
        </form>
    `;
    }
}
