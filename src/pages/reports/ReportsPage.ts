import { html, NixComponent, signal } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { SkeletonCard } from '../../components/Skeleton';
import { FeatureLocked } from '../../components/FeatureLocked';
import { setPageTitle } from '../../stores/router.store';
import { hasFeature } from '../../stores/plans.store';

const now = new Date();
const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
const defaultTo = now.toISOString().split('T')[0];

export class ReportsPage extends NixComponent {
    fromDate = signal(defaultFrom);
    toDate = signal(defaultTo);

    eventsReportQuery = createQuery('reports/events', ({ from, to }: { from: string; to: string }) => api.reports.events(from, to), {
        params: () => ({ from: this.fromDate.value, to: this.toDate.value }),
        staleTime: 60_000,
    });
    sosReportQuery = createQuery('reports/sos', ({ from, to }: { from: string; to: string }) => api.reports.sos(from, to), {
        params: () => ({ from: this.fromDate.value, to: this.toDate.value }),
        staleTime: 60_000,
    });
    membersReportQuery = createQuery('reports/members', () => api.reports.members(), { staleTime: 60_000 });
    financialReportQuery = createQuery('reports/financial', ({ from, to }: { from: string; to: string }) => api.reports.financial(from, to), {
        params: () => ({ from: this.fromDate.value, to: this.toDate.value }),
        staleTime: 60_000,
    });
    supportPointsReportQuery = createQuery('reports/support-points', () => api.reports.supportPoints(), { staleTime: 60_000 });

    onMount() {
        setPageTitle('Reportes');
    }

    isLoading() {
        return this.eventsReportQuery.status.value === 'pending' ||
            this.sosReportQuery.status.value === 'pending' ||
            this.membersReportQuery.status.value === 'pending' ||
            this.financialReportQuery.status.value === 'pending' ||
            this.supportPointsReportQuery.status.value === 'pending';
    }

    hasError() {
        return this.eventsReportQuery.status.value === 'error' ||
            this.sosReportQuery.status.value === 'error' ||
            this.membersReportQuery.status.value === 'error' ||
            this.financialReportQuery.status.value === 'error' ||
            this.supportPointsReportQuery.status.value === 'error';
    }

    renderStat(label: string, value: string | number) {
        return html`<div class="stat-item"><span>${label}</span><strong>${value}</strong></div>`;
    }

    renderSkeletonCard() {
        return html`<div class="dashboard-card">${SkeletonCard()}</div>`;
    }

    render() {
        return html`
        ${() => !hasFeature('analytics')
                ? html`<div class="page-header"><div class="page-header-left"><h1 class="page-title">Reportes</h1></div></div>${FeatureLocked({ feature: 'Reportes y estadísticas', plan: 'Pro' })}`
                : html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Reportes</h1>
                <p class="page-subtitle">Resumen del período seleccionado</p>
            </div>
            <div class="page-header-actions" style="display:flex;align-items:center;gap:var(--mc-space-3);">
                <input type="date" class="input" value=${() => this.fromDate.value} @change=${(e: any) => this.fromDate.update(() => e.target.value)} />
                <span class="text-secondary">—</span>
                <input type="date" class="input" value=${() => this.toDate.value} @change=${(e: any) => this.toDate.update(() => e.target.value)} />
            </div>
        </div>
        <div class="dashboard-grid">
            ${() => this.isLoading()
                        ? html`${this.renderSkeletonCard()}${this.renderSkeletonCard()}${this.renderSkeletonCard()}`
                        : this.hasError()
                            ? html`<div class="alert alert-error"><ion-icon name="alert-circle-outline"></ion-icon> Error al cargar reportes</div>`
                            : html`
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="flag-outline"></ion-icon> Rodadas</h3></div>
                        <div class="card-body">
                            ${() => {
                                    const r = this.eventsReportQuery.data.value;
                                    if (!r) return html`
                                    <div class="empty">
                                        <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin datos disponibles</h4>
                                    </div>`;
                                    return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total Rodadas', r.total || 0)}
                                        ${this.renderStat('Km Recorridos', `${(r.km || 0).toLocaleString()} km`)}
                                        ${this.renderStat('Asistentes Promedio', r.avgAttendees || 0)}
                                    </div>
                                `;
                                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="warning-outline"></ion-icon> SOS</h3></div>
                        <div class="card-body">
                            ${() => {
                                    const r = this.sosReportQuery.data.value;
                                    if (!r) return html`
                                    <div class="empty">
                                        <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin datos disponibles</h4>
                                    </div>`;
                                    const resolutionRate = r.total ? Math.round((r.resolved / r.total) * 100) : 0;
                                    return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total Alertas', r.total || 0)}
                                        ${this.renderStat('Resueltas', r.resolved || 0)}
                                        ${this.renderStat('Tasa de Resolución', `${resolutionRate}%`)}
                                        ${this.renderStat('Tiempo Promedio', r.resolved ? `${r.avgResolutionTime} min` : 'N/A')}
                                    </div>
                                `;
                                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="people-outline"></ion-icon> Miembros</h3></div>
                        <div class="card-body">
                            ${() => {
                                    const r = this.membersReportQuery.data.value;
                                    if (!r) return html`
                                    <div class="empty">
                                        <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin datos disponibles</h4>
                                    </div>`;
                                    return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total Miembros', r.total || 0)}
                                        ${this.renderStat('Activos este Mes', r.activeThisMonth || 0)}
                                        ${this.renderStat('Nivel Promedio', r.avgSkill || '-')}
                                    </div>
                                `;
                                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="cash-outline"></ion-icon> Financiero</h3></div>
                        <div class="card-body">
                            ${() => {
                                    const r = this.financialReportQuery.data.value;
                                    if (!r) return html`
                                    <div class="empty">
                                        <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin datos disponibles</h4>
                                    </div>`;
                                    return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total Pagado', `$${(r.totalPaid || 0).toLocaleString('es-CO')}`)}
                                        ${this.renderStat('Pendiente', `$${(r.totalPending || 0).toLocaleString('es-CO')}`)}
                                        ${this.renderStat('Fallido', `$${(r.totalFailed || 0).toLocaleString('es-CO')}`)}
                                        ${this.renderStat('Transacciones', r.transactionsCount || 0)}
                                    </div>
                                `;
                                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="location-outline"></ion-icon> Puntos de Apoyo</h3></div>
                        <div class="card-body">
                            ${() => {
                                    const r = this.supportPointsReportQuery.data.value;
                                    if (!r) return html`
                                    <div class="empty">
                                        <ion-icon name="bar-chart-outline" class="empty-icon"></ion-icon>
                                        <h4>Sin datos disponibles</h4>
                                    </div>`;
                                    const verificationRate = r.total ? Math.round((r.verified / r.total) * 100) : 0;
                                    return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total', r.total || 0)}
                                        ${this.renderStat('Verificados', r.verified || 0)}
                                        ${this.renderStat('Pendientes', r.pending || 0)}
                                        ${this.renderStat('Tasa Verificación', `${verificationRate}%`)}
                                        ${this.renderStat('Rating Promedio', `${r.avgRating?.toFixed(1) ?? '0.0'} ★`)}
                                    </div>
                                `;
                                }}
                        </div>
                    </div>
                `}
        </div>
    `}
    `;
    }
}
