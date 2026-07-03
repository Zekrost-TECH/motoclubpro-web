import { html, NixComponent, signal, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { setPageTitle } from '../../stores/router.store';
import { SkeletonTable } from '../../components/Skeleton';
import { formatEnum } from '../../utils/labels';
import { openConfirm } from '../../components/ConfirmModal';
import { MapView } from '../../components/MapView';
import { FeatureLocked } from '../../components/FeatureLocked';
import { hasFeature } from '../../stores/plans.store';
import type { SosAlert, SosStatus } from '../../types';

export class SosPage extends NixComponent {
    statusFilter = signal<'all' | SosStatus>('all');
    page = signal(1);
    pageSize = signal(10);

    sosQuery = createQuery(
        'sos/list',
        ({ page, pageSize }: { page: number; pageSize: number }) => api.sos.listPaginated(page, pageSize),
        {
            params: () => ({ page: this.page.value, pageSize: this.pageSize.value }),
            staleTime: 30_000,
        }
    );
    resolveSos = createCommand(
        'sos/resolve',
        async (id: string) => api.sos.resolve(id),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('sos/list');
                invalidateQueries('sos/active');
            },
        }
    );

    onMount() {
        setPageTitle('Alertas SOS');
    }

    filtered() {
        const list = this.sosQuery.data.value?.data || [];
        if (this.statusFilter.value === 'all') return list;
        return list.filter((a) => a.status === this.statusFilter.value);
    }

    paginationMeta() {
        return this.sosQuery.data.value?.meta;
    }

    confirmResolve(id: string, type: string) {
        openConfirm('Resolver Alerta SOS', `¿Marcar la alerta "${formatEnum(type)}" como resuelta?`, () => {
            this.resolveSos.execute(id);
        });
    }

    badgeClass(status: string): string {
        switch (status) {
            case 'activa': return 'badge-danger';
            case 'resuelta': return 'badge-success';
            case 'cancelada': return 'badge-secondary';
            default: return 'badge';
        }
    }

    formatDate(value: string): string {
        if (!value) return '-';
        return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    }

    mapWaypoints(): { lat: number; lng: number; name: string }[] {
        return this.filtered()
            .filter((a) => a.lat != null && a.lng != null)
            .map((a) => ({ lat: a.lat!, lng: a.lng!, name: formatEnum(a.type) }));
    }

    googleMapsLink(a: SosAlert): string | null {
        if (a.lat == null || a.lng == null) return null;
        return `https://www.google.com/maps?q=${a.lat},${a.lng}`;
    }

    render() {
        if (!hasFeature('support_points')) {
            return html`${FeatureLocked({ feature: 'Alertas SOS', plan: 'Básico' })}`;
        }
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Alertas SOS</h1>
                <p class="page-subtitle">Historial y gestión de alertas del club</p>
            </div>
        </div>
        <div class="toolbar">
            <select class="input" @change=${(e: any) => { this.statusFilter.update(() => e.target.value); this.page.update(() => 1); }}>
                <option value="all">Todas</option>
                <option value="activa">Activas</option>
                <option value="resuelta">Resueltas</option>
                <option value="cancelada">Canceladas</option>
            </select>
            <div class="toolbar-spacer"></div>
            <span class="text-secondary">${() => this.paginationMeta()?.total || 0} alertas totales</span>
        </div>
        ${() => {
                const waypoints = this.mapWaypoints();
                return waypoints.length
                    ? html`<div class="dashboard-card" style="margin-bottom:var(--mc-space-6);overflow:hidden;">
                    <div class="card-header"><h3><ion-icon name="map-outline"></ion-icon> Ubicación de alertas</h3></div>
                    <div class="card-body" style="padding:0;">${new MapView(waypoints)}</div>
                </div>`
                    : '';
            }}
        <div class="data-table-wrapper">
            ${() => this.sosQuery.status.value === 'pending'
                ? SkeletonTable(5)
                : this.sosQuery.status.value === 'error'
                    ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar alertas SOS</div>`
                    : html`
                    <table class="data-table">
                        <thead>
                            <tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Descripción</th><th>Ubicación</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${() => {
                            const list = this.filtered();
                            if (!list.length) return html`<tr><td colspan="6" class="empty">Sin alertas SOS registradas.</td></tr>`;
                            return repeat(list, (a: SosAlert) => a.id, (a: SosAlert) => html`
                                    <tr>
                                        <td>${this.formatDate(a.created_at || a.createdAt)}</td>
                                        <td><strong>${formatEnum(a.type)}</strong></td>
                                        <td><span class=${`badge ${this.badgeClass(a.status)}`}>${formatEnum(a.status)}</span></td>
                                        <td>${a.description || '-'}</td>
                                        <td>
                                            ${() => {
                                    const link = this.googleMapsLink(a);
                                    return link
                                        ? html`<a href=${link} target="_blank" rel="noopener" class="btn btn-ghost btn-sm"><ion-icon name="location-outline"></ion-icon> Ver mapa</a>`
                                        : '-';
                                }}
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                ${a.status === 'activa' ? html`
                                                    <button class="btn btn-sm btn-success" @click=${() => this.confirmResolve(a.id, a.type)} disabled=${() => this.resolveSos.isPending.value}>
                                                        <ion-icon name="checkmark-outline"></ion-icon> Resolver
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `);
                        }}
                        </tbody>
                    </table>
                    ${() => {
                            const meta = this.paginationMeta();
                            if (!meta || meta.totalPages <= 1) return '';
                            const current = meta.page;
                            const total = meta.totalPages;
                            return html`
                            <div class="pagination" style="display:flex;align-items:center;justify-content:center;gap:var(--mc-space-3);margin-top:var(--mc-space-4);">
                                <button class="btn btn-sm" disabled=${current <= 1} @click=${() => this.page.update(v => Math.max(1, v - 1))}>Anterior</button>
                                <span class="text-secondary">Página ${current} de ${total}</span>
                                <button class="btn btn-sm" disabled=${current >= total} @click=${() => this.page.update(v => Math.min(total, v + 1))}>Siguiente</button>
                            </div>
                        `;
                        }}
                `}
        </div>
        `;
    }
}
