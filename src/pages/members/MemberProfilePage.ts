import { router } from '../../router';
import { html, signal, NixComponent } from '@deijose/nix-js';
import { createQuery } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import type { User } from '../../types';

export class MemberProfilePage extends NixComponent {
    private router = router;

    motos = signal<any[]>([]);

    userQuery = createQuery(
        'members/profile',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay miembro seleccionado');
            return api.users.get(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );

    onMount() {
        document.title = 'Perfil de Miembro | MotoClub Pro';
    }

    get user() { return this.userQuery.data.value as User | null; }

    getInitials(name?: string): string {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">${() => this.user?.name || 'Perfil de Miembro'}</h1>
                <p class="page-subtitle">${() => this.user?.email || ''}</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-secondary" @click=${() => this.router.navigate('/members')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
            </div>
        </div>
        ${() => {
                const u = this.user;
                if (!u) return html`<div class="empty"><ion-icon name="person-outline" class="empty-icon"></ion-icon><h4>Cargando...</h4></div>`;
                return html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3><ion-icon name="person-outline"></ion-icon> Datos Personales</h3>
                            <span class="badge badge-${u.role}">${u.role}</span>
                        </div>
                        <div class="card-body" style="text-align:center;padding-bottom:var(--mc-space-6);">
                            <div class="avatar avatar-lg" style="margin:0 auto var(--mc-space-4);">${this.getInitials(u.name)}</div>
                            <h2 style="margin:0 0 var(--mc-space-1);font-size:var(--mc-text-xl);">${u.name}</h2>
                            <p class="text-muted">${u.nickname || ''}</p>
                            <div class="stat-list" style="margin-top:var(--mc-space-5);text-align:left;">
                                <div class="stat-item"><span>Email</span><strong>${u.email}</strong></div>
                                <div class="stat-item"><span>Teléfono</span><strong>${u.phone || '-'}</strong></div>
                                <div class="stat-item"><span>Tipo de Sangre</span><strong>${u.bloodType || '-'}</strong></div>
                                <div class="stat-item"><span>Alergias</span><strong>${u.allergies || '-'}</strong></div>
                                <div class="stat-item"><span>Condiciones Médicas</span><strong>${u.medicalConditions || '-'}</strong></div>
                                <div class="stat-item"><span>Contacto de Emergencia</span><strong>${u.emergencyContact || '-'}</strong></div>
                            </div>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="bicycle-outline"></ion-icon> Motocicletas</h3></div>
                        <div class="card-body">
                            ${() => {
                        const list = this.motos.value || [];
                        if (!list.length) return html`<div class="empty"><ion-icon name="bicycle-outline" class="empty-icon"></ion-icon><h4>Sin motos registradas</h4></div>`;
                        return list.map((m: any) => html`
                                    <div class="list-item">
                                        <h4>${m.brand} ${m.model}</h4>
                                        <p>${m.cc}cc · ${m.color} · Placa: ${m.plate}</p>
                                        <p>Km Actual: ${m.currentKm} · Próximo servicio: ${m.nextServiceKm || '-'} km</p>
                                    </div>
                                `);
                    }}
                        </div>
                    </div>
                </div>
            `;
            }}
    `;
    }
}
