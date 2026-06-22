import { html, signal } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';

export function RouteCreatePage(): NixTemplate {
    document.title = 'Nueva Ruta | MotoClub Pro';
    const name = signal('');
    const description = signal('');
    const difficulty = signal('suave');
    const distance = signal(0);
    const estimatedTime = signal('');
    const submitting = signal(false);

    async function handleSubmit() {

        submitting.update(() => true);
        try {
            await api.routes.create({
                name: name.value,
                description: description.value,
                difficulty: difficulty.value as any,
                distance: Number(distance.value),
                estimatedTime: estimatedTime.value,
            });
            showToast('Ruta creada exitosamente', 'success');
            router.navigate('/routes');
        } catch (err: any) {
            showToast(err.message || 'Error al crear ruta', 'error');
        } finally {
            submitting.update(() => false);
        }
    }

    return html`
        <div class="page-header">
            <h2>Nueva Ruta</h2>
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
                    <input type="text" .value=${() => estimatedTime.value} @input=${(e: any) => estimatedTime.update(() => e.target.value)} placeholder="ej: 3h 30m" />
                </div>
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea rows="4" .value=${() => description.value} @input=${(e: any) => description.update(() => e.target.value)}></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn" @click=${() => router.navigate('/routes')}>Cancelar</button>
                <button type="submit" class="btn btn-primary" ?disabled=${() => submitting.value}>
                    ${() => submitting.value ? 'Guardando...' : 'Crear Ruta'}
                </button>
            </div>
        </form>
    `;
}
