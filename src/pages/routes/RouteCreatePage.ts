import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import type { Route } from '../../types';

export class RouteCreatePage extends NixComponent {
    name = signal('');
    description = signal('');
    difficulty = signal('suave');
    distance = signal(0);
    estimatedTime = signal('');
    private router = router;

    createRoute = createCommand(
        'routes/create',
        async (payload: Partial<Route>) => api.routes.create(payload),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('routes/list'),
        }
    );

    onMount() {
        document.title = 'Nueva Ruta | MotoClub Pro';
    }

    async handleSubmit() {
        try {
            await this.createRoute.executeAsync({
                name: this.name.value,
                description: this.description.value,
                difficulty: this.difficulty.value as any,
                distance: Number(this.distance.value),
                estimatedTime: this.estimatedTime.value,
            });
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
