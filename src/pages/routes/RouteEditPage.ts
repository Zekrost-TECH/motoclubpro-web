import { router } from '../../router';
import { html, signal, NixComponent, createForm, required, watch } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { RouteMapEditor } from '../../components/RouteMapEditor';
import { setPageTitle } from '../../stores/router.store';
import type { Route } from '../../types';

export class RouteEditPage extends NixComponent {
    private router = router;
    private routeId = this.router.params.value?.id || '';
    private _unwatch!: () => void;

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
    updateRoute = createCommand(
        'routes/update',
        async (payload: { id: string; data: Partial<Route>; waypoints: any[] }) => {
            await api.routes.update(payload.id, payload.data);
            const geojson = {
                type: 'FeatureCollection',
                features: payload.waypoints.map((wp, idx) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
                    properties: { name: wp.name, type: wp.type, sortOrder: idx },
                })),
            };
            await api.routes.addBatchWaypoints(payload.id, geojson);
        },
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('routes/detail');
                invalidateQueries('routes/list');
            },
        }
    );

    form = createForm(
        { name: '', description: '', difficulty: 'suave' as Route['difficulty'], distance: 0, estimatedTime: '' },
        {
            validators: {
                name: [required()],
            },
            validateOn: 'blur',
        }
    );

    waypoints = signal<any[]>([]);
    pendingLat = signal<number | null>(null);
    pendingLng = signal<number | null>(null);
    _routeMapEditor = new RouteMapEditor();
    startLat = signal<number | null>(null);
    startLng = signal<number | null>(null);
    startName = signal('');

    onInit() {
        this._routeMapEditor.onWaypointsChange = (wps) => this.waypoints.update(() => wps);
        this._routeMapEditor.onPendingChange = (lat, lng) => {
            this.pendingLat.update(() => lat);
            this.pendingLng.update(() => lng);
        };

        this._unwatch = watch(
            () => this.routeQuery.data.value,
            (data) => {
                if (data) {
                    const route = data as Route;
                    this.form.reset({
                        name: route.name,
                        description: route.description || '',
                        difficulty: route.difficulty,
                        distance: route.distance,
                        estimatedTime: route.estimatedTime,
                    });
                    this.startLat.update(() => route.startLat ?? null);
                    this.startLng.update(() => route.startLng ?? null);
                    this.startName.update(() => route.startName ?? '');
                    this.waypoints.update(() => (route.waypoints || []).map((wp: any, idx: number) => ({
                        id: wp.id,
                        name: wp.name || '',
                        type: wp.type || 'parada',
                        lat: wp.lat ?? wp.location?.coordinates?.[1] ?? 0,
                        lng: wp.lng ?? wp.location?.coordinates?.[0] ?? 0,
                        sortOrder: wp.sortOrder ?? idx,
                    })));
                    this._routeMapEditor.setWaypoints(this.waypoints.value);
                }
            },
            { immediate: true }
        );
    }

    onMount() {
        setPageTitle('Editar Ruta');
    }

    onUnmount() {
        this._unwatch?.();
        this.form.dispose();
    }

    async handleSubmit(values: { name: string; description: string; difficulty: Route['difficulty']; distance: number; estimatedTime: string }) {
        try {
            await this.updateRoute.executeAsync({
                id: this.routeId,
                data: {
                    ...values,
                    startLat: this.startLat.value ?? undefined,
                    startLng: this.startLng.value ?? undefined,
                    startName: this.startName.value,
                },
                waypoints: this.waypoints.value,
            });
            showToast('Ruta actualizada', 'success');
            this.router.back();
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        }
    }

    addWaypoint() {
        const list = this.waypoints.value;
        this.waypoints.update(() => [...list, { name: '', type: 'parada', lat: 0, lng: 0 }]);
    }

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

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Editar Ruta</h1>
                <p class="page-subtitle">Actualiza la ruta y sus paradas</p>
            </div>
        </div>
        ${() => this.routeQuery.status.value === 'pending' && !this.routeQuery.data.value
                ? html`<div class="form-card"><p>Cargando ruta...</p></div>`
                : this.routeQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar ruta</div>`
                    : html`
        <form class="form-card" @submit.prevent=${this.form.handleSubmit((values) => this.handleSubmit(values))}>
            <h3 class="form-section-title">Información general</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" value=${() => this.form.fields.name.value.value} @input=${this.form.fields.name.onInput} @blur=${this.form.fields.name.onBlur} required />
                    ${() => this.form.fields.name.error.value ? html`<span class="err">${this.form.fields.name.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Dificultad</label>
                    <select value=${() => this.form.fields.difficulty.value.value} @change=${this.form.fields.difficulty.onInput}>
                        <option value="suave">Suave</option>
                        <option value="off_road">Off Road</option>
                        <option value="viaje_largo">Viaje Largo</option>
                        <option value="expertos">Expertos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Distancia (km)</label>
                    <input type="number" value=${() => this.form.fields.distance.value.value} @input=${this.form.fields.distance.onInput} @blur=${this.form.fields.distance.onBlur} required />
                    ${() => this.form.fields.distance.error.value ? html`<span class="err">${this.form.fields.distance.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Tiempo Estimado</label>
                    <input type="text" value=${() => this.form.fields.estimatedTime.value.value} @input=${this.form.fields.estimatedTime.onInput} />
                </div>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="3" value=${() => this.form.fields.description.value.value} @input=${this.form.fields.description.onInput}></textarea>
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
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click=${() => this.router.back()}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled=${() => this.updateRoute.isPending.value}>
                    <ion-icon name="save-outline"></ion-icon>
                    ${() => this.updateRoute.isPending.value ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    `}
    `;
    }
}
