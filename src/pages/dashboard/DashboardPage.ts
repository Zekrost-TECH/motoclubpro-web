import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { SkeletonKpi } from '../../components/Skeleton';

export function DashboardPage(): NixTemplate {
    document.title = 'Dashboard | MotoClub Pro';

    const upcomingEvents = signal<any[]>([]);
    const members = signal<any[]>([]);
    const events = signal<any[]>([]);
    const sosAlerts = signal<any[]>([]);
    const loading = signal(true);

    effect(() => {
        Promise.all([
            api.events.list('proximo').then(ev => upcomingEvents.update(() => ev)).catch(() => { }),
            api.users.list().then(u => members.update(() => u)).catch(() => { }),
            api.events.list().then(e => events.update(() => e)).catch(() => { }),
            api.sos.active().then(r => sosAlerts.update(() => r.data)).catch(() => { }),
        ]).finally(() => loading.update(() => false));
    });

    return html`
        <div class="dashboard">
            <div class="kpi-grid">
                ${() => loading.value
            ? html`${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}${SkeletonKpi()}`
            : html`
                        <div class="kpi-card">
                            <div class="kpi-icon" style="background:#FF6B0020;color:#FF6B00;">
                                <ion-icon name="people-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${members.value?.length || 0}</span>
                                <span class="kpi-label">Miembros</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon" style="background:#3dc2ff20;color:#3dc2ff;">
                                <ion-icon name="calendar-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${events.value?.length || 0}</span>
                                <span class="kpi-label">Rodadas</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon" style="background:#eb445a20;color:#eb445a;">
                                <ion-icon name="warning-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">${sosAlerts.value?.length || 0}</span>
                                <span class="kpi-label">SOS Activas</span>
                            </div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon" style="background:#2dd36f20;color:#2dd36f;">
                                <ion-icon name="trending-up-outline"></ion-icon>
                            </div>
                            <div class="kpi-info">
                                <span class="kpi-value">0 km</span>
                                <span class="kpi-label">Recorridos</span>
                            </div>
                        </div>
                    `}
            </div>

            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <h3>Próximas Rodadas</h3>
                        <button class="btn btn-sm" @click=${() => router.navigate('/events')}>Ver todas</button>
                    </div>
                    <div class="card-body">
                        ${() => {
            if (loading.value) return html`<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>`;
            const evts = upcomingEvents.value;
            if (!evts?.length) return html`<p class="empty">No hay rodadas próximas</p>`;
            return evts.slice(0, 5).map((e: any) => html`
                                <div class="list-item" @click=${() => router.navigate(`/events/${e.id}`)}>
                                    <div class="list-item-info">
                                        <h4>${e.title}</h4>
                                        <p>${new Date(e.date).toLocaleDateString('es-CO')} · ${e.meetingPoint}</p>
                                    </div>
                                    <span class="badge badge-${e.status}">${e.status}</span>
                                </div>
                            `);
        }}
                    </div>
                </div>

                <div class="dashboard-card sos-card">
                    <div class="card-header">
                        <h3>SOS Activos</h3>
                    </div>
                    <div class="card-body">
                        ${() => {
            const alerts = sosAlerts.value;
            if (!alerts?.length) {
                return html`
                                    <div class="alert-item">
                                        <ion-icon name="checkmark-circle" color="success"></ion-icon>
                                        <span>Todo en orden — sin alertas activas</span>
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
                                        <p>${a.type || 'SOS'} · ${a.timeAgo || 'Hace unos minutos'}</p>
                                    </div>
                                    <span class="badge badge-danger">Activo</span>
                                </div>
                            `);
        }}
                    </div>
                </div>
            </div>
        </div>
    `;
}
