import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { SkeletonTable } from '../../components/Skeleton';

const typeFilter = signal('');

export function SupportPointsPage(): NixTemplate {
    document.title = 'Puntos de Apoyo | MotoClub Pro';
    const allPoints = signal<any[]>([]);
    const loading = signal(true);
    const verifyingId = signal<string | null>(null);

    function refresh() {
        loading.update(() => true);
        api.supportPoints.list().then(p => {
            allPoints.update(() => p);
            loading.update(() => false);
        }).catch(() => {
            loading.update(() => false);
            showToast('Error al cargar puntos de apoyo', 'error');
        });
    }

    effect(() => { refresh(); });

    const filtered = () => {
        let list = allPoints.value || [];
        if (typeFilter.value) list = list.filter((p: any) => p.type === typeFilter.value);
        return list;
    };

    function verifyPoint(id: string, currentStatus: boolean) {
        verifyingId.update(() => id);
        api.supportPoints.verify(id, !currentStatus).then(() => {
            showToast(currentStatus ? 'Verificación removida' : 'Punto verificado', 'success');
            refresh();
        }).catch(() => {
            showToast('Error al verificar', 'error');
        }).finally(() => verifyingId.update(() => null));
    }

    return html`
        <div class="page-header">
            <h2>Puntos de Apoyo</h2>
        </div>
        <div class="toolbar">
            <select class="input" @change=${(e: any) => typeFilter.update(() => e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="taller">Taller</option>
                <option value="llanteria">Llantería</option>
                <option value="gasolinera">Gasolinera</option>
                <option value="grua">Grúa</option>
                <option value="descanso">Descanso</option>
                <option value="hospital">Hospital</option>
            </select>
        </div>
        <div class="data-table-wrapper">
            ${() => loading.value
            ? SkeletonTable(5)
            : html`
                    <table class="data-table">
                        <thead><tr><th>Nombre</th><th>Tipo</th><th>Ciudad</th><th>Verificado</th><th>Rating</th><th></th></tr></thead>
                        <tbody>
                            ${filtered().map((p: any) => html`
                                <tr>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${p.type}</td>
                                    <td>${p.city}</td>
                                    <td><span class="badge badge-${p.verified ? 'success' : 'warning'}">${p.verified ? 'Verificado' : 'Pendiente'}</span></td>
                                    <td>⭐ ${p.rating || 0} (${p.reviewCount || 0})</td>
                                    <td>
                                        <button class="btn btn-sm" @click=${() => verifyPoint(p.id, p.verified)} ?disabled=${() => verifyingId.value === p.id}>
                                            ${() => verifyingId.value === p.id ? '...' : (p.verified ? 'Rechazar' : 'Verificar')}
                                        </button>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                    ${!filtered().length ? html`<p class="empty">No se encontraron puntos de apoyo.</p>` : ''}
                `}
        </div>
    `;
}
