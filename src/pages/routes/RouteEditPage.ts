import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';

export function RouteEditPage(routeId: string): NixTemplate {
    document.title = 'Editar Ruta | MotoClub Pro';
    const name = signal('');
    const description = signal('');
    const difficulty = signal('suave');
    const distance = signal(0);
    const estimatedTime = signal('');
    const waypoints = signal<any[]>([]);
    const submitting = signal(false);

    effect(() => {
        api.routes.get(routeId).then(r => {
            name.update(() => r.name);
            description.update(() => r.description || '');
            difficulty.update(() => r.difficulty);
            distance.update(() => r.distance);
            estimatedTime.update(() => r.estimatedTime);
            waypoints.update(() => (r.waypoints || []).map((wp: any, idx: number) => ({
                id: wp.id,
                name: wp.name || '',
                type: wp.type || 'parada',
                lat: wp.lat ?? wp.location?.coordinates?.[1] ?? 0,
                lng: wp.lng ?? wp.location?.coordinates?.[0] ?? 0,
                sortOrder: wp.sortOrder ?? idx,
            })));
        }).catch(() => { });
    });

    async function handleSubmit() {

        submitting.update(() => true);
        try {
            await api.routes.update(routeId, {
                name: name.value,
                description: description.value,
                difficulty: difficulty.value as any,
                distance: Number(distance.value),
                estimatedTime: estimatedTime.value,
            });
            const geojson = {
                type: 'FeatureCollection',
                features: waypoints.value.map((wp, idx) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
                    properties: { name: wp.name, type: wp.type, sortOrder: idx },
                })),
            };
            await api.routes.addBatchWaypoints(routeId, geojson);
            showToast('Ruta actualizada', 'success');
            router.navigate('/routes');
        } catch (err: any) {
            showToast(err.message || 'Error al guardar', 'error');
        } finally {
            submitting.update(() => false);
        }
    }

    function addWaypoint() {
        const list = waypoints.value;
        waypoints.update(() => [...list, { name: '', type: 'parada', lat: 0, lng: 0 }]);
    }

    function updateWaypoint(index: number, field: string, value: any) {
        const list = [...waypoints.value];
        list[index] = { ...list[index], [field]: value };
        waypoints.update(() => list);
    }

    function removeWaypoint(index: number) {
        const list = [...waypoints.value];
        list.splice(index, 1);
        waypoints.update(() => list);
    }

    return html`
        <div class="page-header">
            <h2>Editar Ruta</h2>
        </div>
        <form class="form-card" @submit.prevent=${handleSubmit}>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" .value=${() => name.value} @input=${(e: any) => name.update(() => e.target.value)} required />
                </div>
                <div class="form-group">
                    <label>Dificultad</label>
                    <select .value=${() => difficulty.value} @change=${(e: any) => difficulty.update(() => e.target.value)}>
                        <option value="suave">Suave</option>
                        <option value="off_road">Off Road</option>
                        <option value="viaje_largo">Viaje Largo</option>
                        <option value="expertos">Expertos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Distancia (km)</label>
                    <input type="number" .value=${() => distance.value} @input=${(e: any) => distance.update(() => Number(e.target.value))} required />
                </div>
                <div class="form-group">
                    <label>Tiempo Estimado</label>
                    <input type="text" .value=${() => estimatedTime.value} @input=${(e: any) => estimatedTime.update(() => e.target.value)} />
                </div>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="3" .value=${() => description.value} @input=${(e: any) => description.update(() => e.target.value)}></textarea>
            </div>
            <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label>Waypoints</label>
                    <button type="button" class="btn btn-sm" @click=${addWaypoint}>
                        <ion-icon name="add-outline"></ion-icon> Agregar Waypoint
                    </button>
                </div>
                ${() => waypoints.value.map((wp: any, idx: number) => html`
                    <div class="form-grid" style="margin-top:0.75rem;padding:0.75rem;border:1px solid var(--gray-300);border-radius:var(--radius);">
                        <div class="form-group" style="margin-bottom:0.5rem;">
                            <label>Nombre</label>
                            <input type="text" .value=${wp.name} @input=${(e: any) => updateWaypoint(idx, 'name', e.target.value)} />
                        </div>
                        <div class="form-group" style="margin-bottom:0.5rem;">
                            <label>Tipo</label>
                            <select .value=${wp.type} @change=${(e: any) => updateWaypoint(idx, 'type', e.target.value)}>
                                <option value="inicio">Inicio</option>
                                <option value="parada">Parada</option>
                                <option value="gasolinera">Gasolinera</option>
                                <option value="restaurante">Restaurante</option>
                                <option value="destino">Destino</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0.5rem;">
                            <label>Lat</label>
                            <input type="number" step="any" .value=${wp.lat} @input=${(e: any) => updateWaypoint(idx, 'lat', Number(e.target.value))} />
                        </div>
                        <div class="form-group" style="margin-bottom:0.5rem;">
                            <label>Lng</label>
                            <input type="number" step="any" .value=${wp.lng} @input=${(e: any) => updateWaypoint(idx, 'lng', Number(e.target.value))} />
                        </div>
                        <div class="form-group" style="margin-bottom:0;grid-column:1 / -1;text-align:right;">
                            <button type="button" class="btn btn-sm btn-danger" @click=${() => removeWaypoint(idx)}>
                                <ion-icon name="trash-outline"></ion-icon> Eliminar
                            </button>
                        </div>
                    </div>
                `)}
                ${() => !waypoints.value.length ? html`<p class="empty">No hay waypoints. Agrega uno.</p>` : ''}
            </div>
            <div class="form-actions">
                <button type="button" class="btn" @click=${() => router.navigate('/routes')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" ?disabled=${() => submitting.value}>
                    ${() => submitting.value ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    `;
}
