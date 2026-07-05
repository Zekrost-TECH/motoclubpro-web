import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createCommand, createQuery, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { MapPicker } from '../../components/MapPicker';
import type { Event } from '../../types';
import { setPageTitle } from '../../stores/router.store';

export class EventCreatePage extends NixComponent {
    title = signal('');
    description = signal('');
    date = signal('');
    time = signal('');
    meetingPoint = signal('');
    meetingPointLat = signal<number | null>(null);
    meetingPointLng = signal<number | null>(null);
    difficulty = signal('suave');
    routeId = signal('');
    private router = router;

    routesQuery = createQuery(
        'routes/list',
        () => api.routes.list(),
        { staleTime: 60_000 }
    );

    createEvent = createCommand(
        'events/create',
        async (payload: Partial<Event>) => api.events.create(payload),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/list'),
        }
    );

    onMount() {
        setPageTitle('Nueva Rodada');
    }

    async handleSubmit() {
        try {
            await this.createEvent.executeAsync({
                title: this.title.value,
                description: this.description.value,
                date: this.date.value,
                time: this.time.value,
                meetingPoint: this.meetingPoint.value,
                meetingPointLat: this.meetingPointLat.value ?? undefined,
                meetingPointLng: this.meetingPointLng.value ?? undefined,
                difficulty: this.difficulty.value as any,
                routeId: this.routeId.value || undefined,
            });
            showToast('Rodada creada exitosamente', 'success');
            this.router.navigate('/events');
        } catch (err: any) {
            showToast(err.message || 'Error al crear rodada', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Nueva Rodada</h1>
                <p class="page-subtitle">Organiza una nueva salida para el club</p>
            </div>
        </div>
        <form class="form-card" @submit.prevent=${() => this.handleSubmit()}>
            <h3 class="form-section-title">Información de la rodada</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" value=${() => this.title.value} @input=${(e: any) => this.title.update(() => e.target.value)} placeholder="Ej. Rodada al Volcán del Totumo" required />
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" value=${() => this.date.value} @input=${(e: any) => this.date.update(() => e.target.value)} required />
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" value=${() => this.time.value} @input=${(e: any) => this.time.update(() => e.target.value)} required />
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
                    <label>Ruta</label>
                    <select value=${() => this.routeId.value} @change=${(e: any) => this.routeId.update(() => e.target.value)}>
                        <option value="">Sin ruta</option>
                        ${() => (this.routesQuery.data.value || []).map((r: any) => html`<option value=${r.id}>${r.name}</option>`)}
                    </select>
                </div>
            </div>
            ${new MapPicker({
            label: 'Punto de Encuentro',
            onChange: (location) => {
                this.meetingPoint.update(() => location.name);
                this.meetingPointLat.update(() => location.lat);
                this.meetingPointLng.update(() => location.lng);
            },
        })}
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="4" value=${() => this.description.value} @input=${(e: any) => this.description.update(() => e.target.value)} placeholder="Detalles importantes de la rodada..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click=${() => this.router.navigate('/events')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled=${() => this.createEvent.isPending.value}>
                    <ion-icon name="save-outline"></ion-icon>
                    ${() => this.createEvent.isPending.value ? 'Guardando...' : 'Crear Rodada'}
                </button>
            </div>
        </form>
    `;
    }
}
