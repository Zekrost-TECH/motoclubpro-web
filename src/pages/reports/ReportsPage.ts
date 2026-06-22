import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { showToast } from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
const to = now.toISOString().split('T')[0];

export function ReportsPage(): NixTemplate {
    document.title = 'Reportes | MotoClub Pro';
    const eventsReport = signal<any>(null);
    const sosReport = signal<any>(null);
    const membersReport = signal<any>(null);
    const loading = signal(true);

    effect(() => {
        Promise.all([
            api.reports.events(from, to).then(r => eventsReport.update(() => r)).catch(() => { }),
            api.reports.sos(from, to).then(r => sosReport.update(() => r)).catch(() => { }),
            api.reports.members().then(r => membersReport.update(() => r)).catch(() => { }),
        ]).then(() => loading.update(() => false))
            .catch(() => {
                loading.update(() => false);
                showToast('Error al cargar reportes', 'error');
            });
    });

    function renderStat(label: string, value: string | number) {
        return html`<div class="stat-item"><span>${label}</span><strong>${value}</strong></div>`;
    }

    function renderSkeletonCard() {
        return html`<div class="dashboard-card">${SkeletonCard()}</div>`;
    }

    return html`
        <div class="page-header">
            <h2>Reportes</h2>
        </div>
        <div class="dashboard-grid">
            ${() => loading.value
            ? html`${renderSkeletonCard()}${renderSkeletonCard()}${renderSkeletonCard()}`
            : html`
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Rodadas (Último Mes)</h3></div>
                        <div class="card-body">
                            ${() => {
                    const r = eventsReport.value;
                    if (!r) return html`<p class="empty">Sin datos disponibles.</p>`;
                    return html`
                                    <div class="stat-list">
                                        ${renderStat('Total Rodadas', r.total || 0)}
                                        ${renderStat('Km Recorridos', `${(r.km || 0).toLocaleString()} km`)}
                                        ${renderStat('Asistentes Promedio', r.avgAttendees || 0)}
                                    </div>
                                `;
                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>SOS (Último Mes)</h3></div>
                        <div class="card-body">
                            ${() => {
                    const r = sosReport.value;
                    if (!r) return html`<p class="empty">Sin datos disponibles.</p>`;
                    return html`
                                    <div class="stat-list">
                                        ${renderStat('Total Alertas', r.total || 0)}
                                        ${renderStat('Resueltas', r.resolved || 0)}
                                        ${renderStat('Tiempo Promedio', `${r.avgResolutionTime || '-'} min`)}
                                    </div>
                                `;
                }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Miembros</h3></div>
                        <div class="card-body">
                            ${() => {
                    const r = membersReport.value;
                    if (!r) return html`<p class="empty">Sin datos disponibles.</p>`;
                    return html`
                                    <div class="stat-list">
                                        ${renderStat('Total Miembros', r.total || 0)}
                                        ${renderStat('Activos este Mes', r.activeThisMonth || 0)}
                                        ${renderStat('Nivel Promedio', r.avgSkill || '-')}
                                    </div>
                                `;
                }}
                        </div>
                    </div>
                `}
        </div>
    `;
}
