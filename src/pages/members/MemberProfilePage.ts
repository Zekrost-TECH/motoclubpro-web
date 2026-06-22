import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';

export function MemberProfilePage(memberId: string): NixTemplate {
    document.title = 'Perfil de Miembro | MotoClub Pro';
    const user = signal<any>(null);
    const motos = signal<any[]>([]);

    effect(() => {
        api.users.get(memberId).then(u => user.update(() => u)).catch(() => { });
        // api.users.motorcycles(memberId) si existe, de momento simulamos
    });

    return html`
        <div class="page-header">
            <h2>${() => user.value?.name || 'Perfil de Miembro'}</h2>
            <button class="btn" @click=${() => router.navigate('/members')}>
                <ion-icon name="arrow-back-outline"></ion-icon> Volver
            </button>
        </div>
        ${() => {
            const u = user.value;
            if (!u) return html`<p class="empty">Cargando...</p>`;
            return html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Datos Personales</h3></div>
                        <div class="card-body">
                            <p><strong>Email:</strong> ${u.email}</p>
                            <p><strong>Nickname:</strong> ${u.nickname || '-'}</p>
                            <p><strong>Teléfono:</strong> ${u.phone || '-'}</p>
                            <p><strong>Rol en Club:</strong> <span class="badge badge-${u.role}">${u.role}</span></p>
                            <p><strong>Tipo de Sangre:</strong> ${u.bloodType || '-'}</p>
                            <p><strong>Alergias:</strong> ${u.allergies || '-'}</p>
                            <p><strong>Condiciones Médicas:</strong> ${u.medicalConditions || '-'}</p>
                            <p><strong>Contacto de Emergencia:</strong> ${u.emergencyContact || '-'}</p>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Motocicletas</h3></div>
                        <div class="card-body">
                            ${() => {
                    const list = motos.value || [];
                    if (!list.length) return html`<p class="empty">Sin motos registradas.</p>`;
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
