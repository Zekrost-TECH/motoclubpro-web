import { router } from '../../router';
import { html, signal, NixComponent, createForm, required, watch } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { MapPicker } from '../../components/MapPicker';
import { setPageTitle } from '../../stores/router.store';
import type { Event } from '../../types';

export class EventEditPage extends NixComponent {
    private router = router;
    private eventId = this.router.params.value?.id || '';
    private _unwatch!: () => void;
    private _meetingPointLat = signal<number | null>(null);
    private _meetingPointLng = signal<number | null>(null);

    eventQuery = createQuery(
        'events/detail',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.get(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    updateEvent = createCommand(
        'events/update',
        async (payload: { id: string; data: Partial<Event> }) => api.events.update(payload.id, payload.data),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('events/detail');
                invalidateQueries('events/list');
            },
        }
    );

    routesQuery = createQuery(
        'routes/list',
        () => api.routes.list(),
        { staleTime: 60_000 }
    );

    form = createForm(
        { title: '', description: '', date: '', time: '', meetingPoint: '', difficulty: 'suave' as Event['difficulty'], routeId: '' },
        {
            validators: {
                title: [required()],
                date: [required()],
                time: [required()],
                meetingPoint: [required()],
            },
            validateOn: 'blur',
        }
    );

    onInit() {
        this._unwatch = watch(
            () => this.eventQuery.data.value,
            (data) => {
                if (data) {
                    const event = data as Event;
                    this.form.reset({
                        title: event.title,
                        description: event.description || '',
                        date: event.date ? event.date.slice(0, 10) : '',
                        time: event.time,
                        meetingPoint: event.meetingPoint,
                        difficulty: event.difficulty,
                        routeId: event.routeId || '',
                    });
                    this._meetingPointLat.update(() => event.meetingPointLat ?? null);
                    this._meetingPointLng.update(() => event.meetingPointLng ?? null);
                }
            },
            { immediate: true }
        );
    }

    onMount() {
        setPageTitle('Editar Rodada');
    }

    onUnmount() {
        this._unwatch?.();
        this.form.dispose();
    }

    async handleSubmit(values: { title: string; description: string; date: string; time: string; meetingPoint: string; difficulty: Event['difficulty']; routeId: string }) {
        try {
            await this.updateEvent.executeAsync({
                id: this.eventId,
                data: {
                    ...values,
                    routeId: values.routeId || undefined,
                    meetingPointLat: this._meetingPointLat.value ?? undefined,
                    meetingPointLng: this._meetingPointLng.value ?? undefined,
                },
            });
            showToast('Rodada actualizada', 'success');
            this.router.back();
        } catch (err: any) {
            showToast(err.message || 'Error al actualizar', 'error');
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Editar Rodada</h1>
                <p class="page-subtitle">Actualiza los detalles de la salida</p>
            </div>
        </div>
        ${() => this.eventQuery.status.value === 'pending' && !this.eventQuery.data.value
                ? html`<div class="form-card"><p>Cargando rodada...</p></div>`
                : this.eventQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar rodada</div>`
                    : html`
        <form class="form-card" @submit.prevent=${this.form.handleSubmit((values) => this.handleSubmit(values))}>
            <h3 class="form-section-title">Información de la rodada</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" value=${() => this.form.fields.title.value.value} @input=${this.form.fields.title.onInput} @blur=${this.form.fields.title.onBlur} required />
                    ${() => this.form.fields.title.error.value ? html`<span class="err">${this.form.fields.title.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" value=${() => this.form.fields.date.value.value} @input=${this.form.fields.date.onInput} @blur=${this.form.fields.date.onBlur} required />
                    ${() => this.form.fields.date.error.value ? html`<span class="err">${this.form.fields.date.error.value}</span>` : null}
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" value=${() => this.form.fields.time.value.value} @input=${this.form.fields.time.onInput} @blur=${this.form.fields.time.onBlur} required />
                    ${() => this.form.fields.time.error.value ? html`<span class="err">${this.form.fields.time.error.value}</span>` : null}
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
                    <label>Ruta</label>
                    <select value=${() => this.form.fields.routeId.value.value} @change=${this.form.fields.routeId.onInput}>
                        <option value="">Sin ruta</option>
                        ${() => (this.routesQuery.data.value || []).map((r: any) => html`<option value=${r.id}>${r.name}</option>`)}
                    </select>
                </div>
            </div>
            ${new MapPicker({
                        label: 'Punto de Encuentro',
                        initialLocation: {
                            lat: this._meetingPointLat.value ?? undefined,
                            lng: this._meetingPointLng.value ?? undefined,
                            name: this.form.fields.meetingPoint.value.value,
                        },
                        onChange: (location) => {
                            this.form.fields.meetingPoint.value.update(() => location.name);
                            this.form.fields.meetingPoint.onInput({ target: { value: location.name } } as any);
                            this._meetingPointLat.update(() => location.lat);
                            this._meetingPointLng.update(() => location.lng);
                        },
                    })}
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="4" value=${() => this.form.fields.description.value.value} @input=${this.form.fields.description.onInput}></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click=${() => this.router.back()}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled=${() => this.updateEvent.isPending.value || this.form.isSubmitting.value}>
                    <ion-icon name="save-outline"></ion-icon>
                    ${() => this.updateEvent.isPending.value || this.form.isSubmitting.value ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    `}
    `;
    }
}
