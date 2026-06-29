import { html, signal, NixComponent } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { SkeletonTable } from '../../components/Skeleton';
import { formatEnum } from '../../utils/labels';

export class SupportPointsPage extends NixComponent {
    typeFilter = signal('');

    pointsQuery = createQuery('support-points/list', () => api.supportPoints.list(), { staleTime: 60_000 });

    verifyPointCommand = createCommand(
        'support-points/verify',
        async (payload: { id: string; verified: boolean }) => api.supportPoints.verify(payload.id, payload.verified),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('support-points/list'),
        }
    );

    onMount() {
        document.title = 'Puntos de Apoyo | MotoClub Pro';
    }

    filtered() {
        let list = this.pointsQuery.data.value || [];
        if (this.typeFilter.value) list = list.filter((p: any) => p.type === this.typeFilter.value);
        return list;
    }

    verifyPoint(id: string, currentStatus: boolean) {
        this.verifyPointCommand.execute({ id, verified: !currentStatus });
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Puntos de Apoyo</h1>
                <p class="page-subtitle">Talleres, gasolineras, grúas y descansos verificados</p>
            </div>
        </div>
        <div class="toolbar">
            <select class="input" @change=${(e: any) => this.typeFilter.update(() => e.target.value)}>
                <option value="">Todos los tipos</option>
                <option value="taller">Taller</option>
                <option value="llanteria">Llantería</option>
                <option value="gasolinera">Gasolinera</option>
                <option value="grua">Grúa</option>
                <option value="descanso">Descanso</option>
                <option value="hospital">Hospital</option>
            </select>
            <div class="toolbar-spacer"></div>
            <span class="text-secondary">${() => this.filtered().length} puntos</span>
        </div>
        <div class="data-table-wrapper">
            ${() => this.pointsQuery.status.value === 'pending'
                ? SkeletonTable(5)
                : this.pointsQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar puntos de apoyo</div>`
                    : html`
                    <table class="data-table">
                        <thead><tr><th>Nombre</th><th>Tipo</th><th>Ciudad</th><th>Verificado</th><th>Rating</th><th></th></tr></thead>
                        <tbody>
                            ${this.filtered().map((p: any) => html`
                                <tr>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${formatEnum(p.type)}</td>
                                    <td>${p.city}</td>
                                    <td><span class="badge badge-${p.verified ? 'success' : 'warning'}">${p.verified ? 'Verificado' : 'Pendiente'}</span></td>
                                    <td><ion-icon name="star" style="color:var(--mc-warning-500);"></ion-icon> ${p.rating || 0} (${p.reviewCount || 0})</td>
                                    <td>
                                        <button class="btn btn-sm ${p.verified ? 'btn-danger' : 'btn-primary'}" @click=${() => this.verifyPoint(p.id, p.verified)} disabled=${() => this.verifyPointCommand.isPending.value}>
                                            ${() => this.verifyPointCommand.isPending.value ? '...' : (p.verified ? 'Rechazar' : 'Verificar')}
                                        </button>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                    ${!this.filtered().length ? html`
                        <div class="empty">
                            <ion-icon name="location-outline" class="empty-icon"></ion-icon>
                            <h4>No se encontraron puntos de apoyo</h4>
                            <p>Prueba ajustando el filtro.</p>
                        </div>
                    ` : ''}
                `}
        </div>
    `;
    }
}
