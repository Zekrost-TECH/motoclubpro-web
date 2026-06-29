import { router } from '../../router';
import { html, NixComponent, createForm, required, watch } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import type { Event } from '../../types';

export class EventEditPage extends NixComponent {
    private router = router;
    private eventId = this.router.params.value?.id || '';
    private _unwatch!: () => void;

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

    form = createForm(
        { title: '', description: '', date: '', time: '', meetingPoint: '', difficulty: 'suave' as Event['difficulty'] },
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
                    });
                }
            },
            { immediate: true }
        );
    }

    onMount() {
        document.title = 'Editar Rodada | MotoClub Pro';
    }

    onUnmount() {
        this._unwatch?.();
        this.form.dispose();
    }

    async handleSubmit(values: { title: string; description: string; date: string; time: string; meetingPoint: string; difficulty: Event['difficulty'] }) {
        try {
            await this.updateEvent.executeAsync({
                id: this.eventId,
                data: values,
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
            </div>
            <div class="form-group">
                <label>Punto de Encuentro</label>
                <input type="text" value=${() => this.form.fields.meetingPoint.value.value} @input=${this.form.fields.meetingPoint.onInput} @blur=${this.form.fields.meetingPoint.onBlur} required />
                ${() => this.form.fields.meetingPoint.error.value ? html`<span class="err">${this.form.fields.meetingPoint.error.value}</span>` : null}
            </div>
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
