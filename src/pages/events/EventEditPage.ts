import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';

export function EventEditPage(eventId: string): NixTemplate {
    document.title = 'Editar Rodada | MotoClub Pro';
    const title = signal('');
    const description = signal('');
    const date = signal('');
    const time = signal('');
    const meetingPoint = signal('');
    const difficulty = signal('suave');
    const submitting = signal(false);

    effect(() => {
        api.events.get(eventId).then(e => {
            title.update(() => e.title);
            description.update(() => e.description || '');
            date.update(() => e.date);
            time.update(() => e.time);
            meetingPoint.update(() => e.meetingPoint);
            difficulty.update(() => e.difficulty);
        }).catch(() => { });
    });

    async function handleSubmit() {

        submitting.update(() => true);
        try {
            await api.events.update(eventId, {
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value,
                meetingPoint: meetingPoint.value,
                difficulty: difficulty.value as any,
            });
            showToast('Rodada actualizada', 'success');
            router.navigate('/events');
        } catch (err: any) {
            showToast(err.message || 'Error al actualizar', 'error');
        } finally {
            submitting.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Editar Rodada</h2>
        </div>
        <form class="form-card" @submit.prevent=${handleSubmit}>
            <div class="form-grid">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" .value=${() => title.value} @input=${(e: any) => title.update(() => e.target.value)} required />
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" .value=${() => date.value} @input=${(e: any) => date.update(() => e.target.value)} required />
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" .value=${() => time.value} @input=${(e: any) => time.update(() => e.target.value)} required />
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
            </div>
            <div class="form-group">
                <label>Punto de Encuentro</label>
                <input type="text" .value=${() => meetingPoint.value} @input=${(e: any) => meetingPoint.update(() => e.target.value)} required />
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="4" .value=${() => description.value} @input=${(e: any) => description.update(() => e.target.value)}></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" @click=${() => router.navigate('/events')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" ?disabled=${() => submitting.value}>
                    ${() => submitting.value ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    `;
}
