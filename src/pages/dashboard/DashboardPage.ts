import { router } from '../../router';
import { html, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { SkeletonKpi } from '../../components/Skeleton';
import { activeClub } from '../../stores/clubs.store';
import { formatEnum } from '../../utils/labels';

const now = new Date();
const reportFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
const reportTo = now.toISOString().split('T')[0];

export class DashboardPage extends NixComponent {
    private router = router;

    upcomingEventsQuery = createQuery(
        'events/upcoming',
        () => api.events.list('proximo'),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    membersQuery = createQuery(
        'users/list',
        () => api.users.list(),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );
    eventsQuery = createQuery(
        'events/list',
        () => api.events.list(),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );
    sosAlertsQuery = createQuery(
        'sos/active',
        () => api.sos.active(),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    eventsReportQuery = createQuery(
        'reports/events',
        () => api.reports.events(reportFrom, reportTo),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );
    routesQuery = createQuery(
        'routes/list',
        () => api.routes.list(),
        {
            params: () => ({ clubId: activeClub.value?.id || '' }),
            staleTime: 60_000,
        }
    );

    onMount() {
        document.title = 'Dashboard | MotoClub Pro';
    }

    isLoading() {
        return this.upcomingEventsQuery.status.value === 'pending' ||
            this.membersQuery.status.value === 'pending' ||
            this.eventsQuery.status.value === 'pending' ||
            this.sosAlertsQuery.status.value === 'pending' ||
            this.eventsReportQuery.status.value === 'pending' ||
            this.routesQuery.status.value === 'pending'
    }

    totalKm() {
        const km = this.eventsReportQuery.data.value?.km;
        return km != null ? km : 0;
    }

    recentEvents() {
        const list = (this.eventsQuery.data.value || []) as { id: string; title: string; date: string; status: string; meetingPoint?: string }[];
        return list
            .filter((e) => e.status === 'completado')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }

    render() {
        return html`
        <div class="dashboard">
            <div class="page-header">
                <div class="page-header-left">
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">${() => activeClub.value?.name || 'Resumen del club'}</p>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" @click=${() => this.router.navigate('/events/create')}>
                        <ion-icon name="add-outline"></ion-icon>
                        Nueva rodada
                    </button>
                </div>
            </div>

            <div class="kpi-grid">
                ${() => this.isLoading()
                ? html`${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}`
                : html`
                        <div class="kpi-card">
                            <div class="kpi-icon accent">
                                <ion-icon name="people-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${this.membersQuery.data.value?.length || 0}</span>
                                <span class="kpi-label">Miembros</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon info">
                                <ion-icon name="calendar-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${this.eventsQuery.data.value?.length || 0}</span>
                                <span class="kpi-label">Rodadas</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon warning">
                                <ion-icon name="map-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${this.routesQuery.data.value?.length || 0}</span>
                                <span class="kpi-label">Rutas</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon danger">
                                <ion-icon name="warning-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${this.sosAlertsQuery.data.value?.length || 0}</span>
                                <span class="kpi-label">SOS Activas</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon success">
                                <ion-icon name="trending-up-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${() => `${this.totalKm().toLocaleString('es-CO')} km`}</span>
                                <span class="kpi-label">Recorridos</span>
                            </div>
                        </div>
                    `}
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>Próximas Rodadas</h3>
                        <button class="btn btn-ghost btn-sm" @click=${() => this.router.navigate('/events')}>
                            Ver todas
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="card-body">
                        ${() => {
                if (this.isLoading()) return html`<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>`;
                const evts = this.upcomingEventsQuery.data.value;
                if (!evts?.length) return html`
                                <div class="empty">
                                    <ion-icon name="calendar-outline" class="empty-icon"></ion-icon>
                                    <h4>Sin rodadas próximas</h4>
                                    <p>Crea una nueva rodada para empezar.</p>
                                </div>`;
                return evts.slice(0, 5).map((e: any) => html`
                                <div class="list-item" @click=${() => this.router.navigate(`/events/${e.id}`)}>
                                    <div class="list-item-info">
                                        <h4>${e.title}</h4>
                                        <p>${new Date(e.date).toLocaleDateString('es-CO')} · ${e.meetingPoint || 'Punto de encuentro'}</p>
                                    </div>
                                    <div class="list-item-meta">
                                        <span class="badge badge-${e.status}">${formatEnum(e.status)}</span>
                                    </div>
                                </div>
                            `);
            }}
                    </div>
                </div>

                <div class="dashboard-card sos-card">
                    <div class="card-header">
                        <h3>SOS Activos</h3>
                        <button class="btn btn-ghost btn-sm" @click=${() => this.router.navigate('/sos')}>
                            Ver todas
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="card-body">
                        ${() => {
                const alerts = this.sosAlertsQuery.data.value;
                if (this.isLoading()) return html`<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>`;
                if (!alerts?.length) {
                    return html`
                                    <div class="empty">
                                        <ion-icon name="shield-checkmark-outline" class="empty-icon"></ion-icon>
                                        <h4>Todo en orden</h4>
                                        <p>No hay alertas SOS activas.</p>
                                    </div>
                                `;
                }
                return alerts.map((a: any) => html`
                                <div class="sos-list-item">
                                    <div class="sos-icon">
                                        <ion-icon name="warning-outline"></ion-icon>
                                    </div>
                                    <div class="sos-info">
                                        <h4>${a.userName || 'Usuario desconocido'}</h4>
                                        <p>${formatEnum(a.type) || 'SOS'} · ${a.timeAgo || 'Hace unos minutos'}</p>
                                    </div>
                                    <span class="badge badge-danger">Activo</span>
                                </div>
                            `);
            }}
                    </div>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>Últimas Rodadas</h3>
                        <button class="btn btn-ghost btn-sm" @click=${() => this.router.navigate('/events')}>
                            Ver todas
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    </div>
                    <div class="card-body">
                        ${() => {
                if (this.isLoading()) return html`<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>`;
                const evts = this.recentEvents();
                if (!evts.length) return html`
                                <div class="empty">
                                    <ion-icon name="flag-outline" class="empty-icon"></ion-icon>
                                    <h4>Sin rodadas completadas</h4>
                                    <p>Aún no hay rodadas finalizadas.</p>
                                </div>`;
                return evts.map((e) => html`
                                <div class="list-item" @click=${() => this.router.navigate(`/events/${e.id}`)}>
                                    <div class="list-item-info">
                                        <h4>${e.title}</h4>
                                        <p>${new Date(e.date).toLocaleDateString('es-CO')} · ${e.meetingPoint || 'Punto de encuentro'}</p>
                                    </div>
                                    <div class="list-item-meta">
                                        <span class="badge badge-${e.status}">${formatEnum(e.status)}</span>
                                    </div>
                                </div>
                            `);
            }}
                    </div>
                </div>
            </div>
        </div>
    `;
    }
}
