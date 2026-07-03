import { router } from '../../router';
import { setPageTitle } from '../../stores/router.store';
import { html, signal, NixComponent, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, updateQueryData } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { SkeletonTable } from '../../components/Skeleton';
import { FeatureLocked } from '../../components/FeatureLocked';
import { formatEnum } from '../../utils/labels';
import { hasFeature } from '../../stores/plans.store';
import type { SupportPoint } from '../../types';

export class SupportPointsPage extends NixComponent {
    private router = router;
    typeFilter = signal('');
    verifyingId = signal('');

    pointsQuery = createQuery('support-points/list', () => api.supportPoints.list(), { staleTime: 60_000 });

    verifyPointCommand = createCommand(
        'support-points/verify',
        async (payload: { id: string; verified: boolean }) => api.supportPoints.verify(payload.id, payload.verified),
        {
            mode: 'latest',
            onSuccess: (result) => {
                updateQueryData<SupportPoint[]>('support-points/list', (current = []) =>
                    current.map((p) => (p.id === result.id ? { ...p, verified: result.verified } : p))
                );
                this.verifyingId.update(() => '');
            },
            onError: () => this.verifyingId.update(() => ''),
        }
    );

    onMount() {
        setPageTitle('Puntos de Apoyo');
    }

    filtered() {
        let list = this.pointsQuery.data.value || [];
        if (this.typeFilter.value) list = list.filter((p: SupportPoint) => p.type === this.typeFilter.value);
        return list;
    }

    verifyPoint(id: string, currentStatus: boolean) {
        this.verifyingId.update(() => id);
        this.verifyPointCommand.execute({ id, verified: !currentStatus });
    }

    render() {
        return html`
        ${() => !hasFeature('support_points')
                ? html`<div class="page-header"><div class="page-header-left"><h1 class="page-title">Puntos de Apoyo</h1></div></div>${FeatureLocked({ feature: 'Puntos de apoyo en mapa', plan: 'Básico' })}`
                : html`
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
            <button class="btn btn-primary" @click=${() => this.router.navigate('/support/create')}>
                <ion-icon name="add-outline"></ion-icon> Nuevo punto
            </button>
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
                            ${() => {
                                    const list = this.filtered();
                                    if (!list.length) return html`<tr><td colspan="6" class="empty">No se encontraron puntos de apoyo.</td></tr>`;
                                    return repeat(list, (p: SupportPoint) => p.id, (p: SupportPoint) => {
                                        const badgeClass = p.verified ? 'badge-success' : 'badge-warning';
                                        const badgeText = p.verified ? 'Verificado' : 'Pendiente';
                                        const verifyBtnClass = p.verified ? 'btn-danger' : 'btn-primary';
                                        const verifyBtnText = p.verified ? 'Rechazar' : 'Verificar';
                                        const btnClass = `btn btn-sm ${verifyBtnClass}`;
                                        const isVerifying = () => this.verifyingId.value === p.id;
                                        return html`
                                <tr @click=${() => this.router.navigate(`/support/${p.id}`)}>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${formatEnum(p.type)}</td>
                                    <td>${p.city || '-'}</td>
                                    <td><span class=${`badge ${badgeClass}`}>${badgeText}</span></td>
                                    <td><ion-icon name="star" style="color:var(--mc-warning-500);"></ion-icon> ${p.rating || 0} (${p.reviewCount || 0})</td>
                                    <td>
                                        <div class="table-actions">
                                            ${() => hasFeature('verified_support_points') ? html`
                                            <button class=${btnClass} @click.stop=${() => this.verifyPoint(p.id, p.verified)} disabled=${() => isVerifying()}>
                                                ${() => isVerifying() ? '...' : verifyBtnText}
                                            </button>` : ''}
                                            <button class="btn btn-sm btn-secondary" @click.stop=${() => this.router.navigate(`/support/${p.id}/edit`)} title="Editar">
                                                <ion-icon name="create-outline"></ion-icon>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                `;
                                    });
                                }}
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
    `}
    `;
    }
}
