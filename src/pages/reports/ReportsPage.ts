import { html, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { SkeletonCard } from '../../components/Skeleton';

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
const to = now.toISOString().split('T')[0];

export class ReportsPage extends NixComponent {
    eventsReportQuery = createQuery('reports/events', () => api.reports.events(from, to), { staleTime: 60_000 });
    sosReportQuery = createQuery('reports/sos', () => api.reports.sos(from, to), { staleTime: 60_000 });
    membersReportQuery = createQuery('reports/members', () => api.reports.members(), { staleTime: 60_000 });

    onMount() {
        document.title = 'Reportes | MotoClub Pro';
    }

    isLoading() {
        return this.eventsReportQuery.status.value === 'pending' ||
            this.sosReportQuery.status.value === 'pending' ||
            this.membersReportQuery.status.value === 'pending';
    }

    hasError() {
        return this.eventsReportQuery.status.value === 'error' ||
            this.sosReportQuery.status.value === 'error' ||
            this.membersReportQuery.status.value === 'error';
    }

    renderStat(label: string, value: string | number) {
        return html`<div class="stat-item"><span>${label}</span><strong>${value}</strong></div>`;
    }

    renderSkeletonCard() {
        return html`<div class="dashboard-card">${SkeletonCard()}</div>`;
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Reportes</h1>
                <p class="page-subtitle">Resumen del último mes</p>
            </div>
            <div class="page-header-actions">
                <span class="text-secondary">${from} — ${to}</span>
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
                            return html`
                                    <div class="stat-list">
                                        ${this.renderStat('Total Alertas', r.total || 0)}
                                        ${this.renderStat('Resueltas', r.resolved || 0)}
                                        ${this.renderStat('Tiempo Promedio', `${r.avgResolutionTime || '-'} min`)}
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
                `}
        </div>
    `;
    }
}
