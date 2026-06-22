import { html, signal } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';

export function EventCreatePage(): NixTemplate {
    document.title = 'Nueva Rodada | MotoClub Pro';
    const title = signal('');
    const description = signal('');
    const date = signal('');
    const time = signal('');
    const meetingPoint = signal('');
    const difficulty = signal('suave');
    const submitting = signal(false);

    async function handleSubmit() {

        submitting.update(() => true);
        try {
            await api.events.create({
                title: title.value,
                description: description.value,
                date: date.value,
                time: time.value,
                meetingPoint: meetingPoint.value,
                difficulty: difficulty.value as any,
            });
            showToast('Rodada creada exitosamente', 'success');
            router.navigate('/events');
        } catch (err: any) {
            showToast(err.message || 'Error al crear rodada', 'error');
        } finally {
            submitting.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Nueva Rodada</h2>
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
                    ${() => submitting.value ? 'Guardando...' : 'Crear Rodada'}
                </button>
            </div>
        </form>
    `;
}
