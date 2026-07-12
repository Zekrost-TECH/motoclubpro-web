import { router } from '../../router';
import { html, NixComponent, createForm, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import type { Event, EventGuest, GuestType } from '../../types';
import { showToast } from '../../components/Toast';
import { setPageTitle } from '../../stores/router.store';
import { openConfirm } from '../../components/ConfirmModal';
import { authStore } from '../../stores/auth.store';
import { formatEnum } from '../../utils/labels';
import { formatLocalDate } from '../../utils/date';

export class EventGuestsPage extends NixComponent {
    private router = router;
    private eventId = this.router.params.value?.id || '';

    guestForm = createForm(
        { fullName: '', guestType: 'invitado' as GuestType, phone: '', notes: '' },
        {
            validators: { fullName: [] },
            validateOn: 'blur',
        }
    );

    eventQuery = createQuery(
        'events/detail',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.get(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );

    guestsQuery = createQuery(
        'events/guests',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.guests.list(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );

    addGuest = createCommand(
        'events/guests/add',
        async (payload: { eventId: string; data: { guest_type: string; full_name: string; phone?: string; notes?: string } }) =>
            api.events.guests.create(payload.eventId, payload.data),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('events/guests');
                invalidateQueries('events/detail');
            },
        }
    );

    removeGuest = createCommand(
        'events/guests/remove',
        async (payload: { eventId: string; guestId: string }) =>
            api.events.guests.remove(payload.eventId, payload.guestId),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('events/guests');
                invalidateQueries('events/detail');
            },
        }
    );

    onMount() {
        setPageTitle('Invitados de Rodada');
    }

    onUnmount() {
        this.guestForm.dispose();
    }

    get event() { return this.eventQuery.data.value as Event | null; }
    get guests() { return this.guestsQuery.data.value as EventGuest[] || []; }

    canRemove(guest: EventGuest): boolean {
        const user = authStore.currentUser.value;
        if (!user) return false;
        if (guest.invitedBy === user.id) return true;
        return user.role === 'admin' || user.role === 'leader' || user.role === 'superadmin';
    }

    async handleAddGuest() {
        try {
            await this.addGuest.executeAsync({
                eventId: this.eventId,
                data: {
                    full_name: this.guestForm.fields.fullName.value.value,
                    guest_type: this.guestForm.fields.guestType.value.value,
                    phone: this.guestForm.fields.phone.value.value || undefined,
                    notes: this.guestForm.fields.notes.value.value || undefined,
                },
            });
            showToast('Invitado agregado', 'success');
            this.guestForm.reset({ fullName: '', guestType: 'invitado', phone: '', notes: '' });
        } catch (err: any) {
            showToast(err.message || 'Error al agregar invitado', 'error');
        }
    }

    confirmRemove(guest: EventGuest) {
        openConfirm('Eliminar invitado', `¿Eliminar a ${guest.fullName}?`, () => {
            this.removeGuest.execute({ eventId: this.eventId, guestId: guest.id });
        });
    }

    guestTypeBadge(guestType: GuestType): string {
        return guestType === 'acompañante' ? 'badge-info' : 'badge-secondary';
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Invitados</h1>
                <p class="page-subtitle">${() => this.event ? `${this.event.title} · ${formatLocalDate(this.event.date)}` : 'Cargando rodada...'}</p>
            </div>
            <div class="page-header-actions" style="display:flex;align-items:center;gap:var(--mc-space-3);">
                <button class="btn btn-secondary" @click=${() => this.router.navigate(`/events/${this.eventId}`)}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver a la rodada
                </button>
            </div>
        </div>
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header"><h3><ion-icon name="person-add-outline"></ion-icon> Agregar Invitado</h3></div>
                <div class="card-body">
                    <form style="display:flex;flex-wrap:wrap;gap:var(--mc-space-3);margin-bottom:var(--mc-space-4);align-items:flex-end;" @submit.prevent=${() => this.handleAddGuest()}>
                        <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
                            <label>Nombre completo</label>
                            <input type="text" value=${() => this.guestForm.fields.fullName.value.value} @input=${this.guestForm.fields.fullName.onInput} placeholder="Ej. Ana María López" required />
                        </div>
                        <div class="form-group" style="width:160px;margin-bottom:0;">
                            <label>Tipo</label>
                            <select value=${() => this.guestForm.fields.guestType.value.value} @change=${this.guestForm.fields.guestType.onInput}>
                                <option value="invitado">Invitado</option>
                                <option value="acompañante">Acompañante</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex:1;min-width:160px;margin-bottom:0;">
                            <label>Teléfono</label>
                            <input type="tel" value=${() => this.guestForm.fields.phone.value.value} @input=${this.guestForm.fields.phone.onInput} placeholder="Opcional" />
                        </div>
                        <div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">
                            <label>Notas</label>
                            <input type="text" value=${() => this.guestForm.fields.notes.value.value} @input=${this.guestForm.fields.notes.onInput} placeholder="Opcional" />
                        </div>
                        <button type="submit" class="btn btn-sm btn-primary" disabled=${() => this.addGuest.isPending.value || this.guestForm.isSubmitting.value} style="height:38px;">
                            <ion-icon name="add-outline"></ion-icon>
                        </button>
                    </form>
                    <p style="color:var(--mc-text-secondary);font-size:0.875rem;">
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Los acompañantes son personas que van en la moto de un piloto. Los invitados con moto propia no cuentan con rastreo ni seguro dentro del club.
                    </p>
                </div>
            </div>
            <div class="dashboard-card">
                <div class="card-header"><h3><ion-icon name="stats-chart-outline"></ion-icon> Resumen</h3></div>
                <div class="card-body">
                    <div class="stat-list">
                        <div class="stat-item"><span>Total invitados</span><strong>${() => this.guests.length}</strong></div>
                        <div class="stat-item"><span>Acompañantes</span><strong>${() => this.guests.filter((g) => g.guestType === 'acompañante').length}</strong></div>
                        <div class="stat-item"><span>Invitados con moto</span><strong>${() => this.guests.filter((g) => g.guestType === 'invitado').length}</strong></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="dashboard-card" style="margin-top:var(--mc-space-6);">
            <div class="card-header"><h3><ion-icon name="people-outline"></ion-icon> Listado de Invitados</h3></div>
            <div class="card-body">
                <div class="data-table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Nombre</th><th>Tipo</th><th>Teléfono</th><th>Notas</th><th>Invitado por</th><th></th></tr></thead>
                        <tbody>
                            ${() => {
                                const list = this.guests;
                                if (!list.length) return html`<tr><td colspan="6" class="empty">Sin invitados registrados.</td></tr>`;
                                return repeat(list, (g: EventGuest) => g.id, (g: EventGuest) => html`
                                    <tr>
                                        <td><strong>${g.fullName}</strong></td>
                                        <td><span class=${`badge ${this.guestTypeBadge(g.guestType)}`}>${formatEnum(g.guestType)}</span></td>
                                        <td>${g.phone || '-'}</td>
                                        <td>${g.notes || '-'}</td>
                                        <td>${g.inviterName || g.invitedBy}</td>
                                        <td>
                                            ${() => this.canRemove(g) ? html`
                                                <button class="btn-icon danger" @click=${() => this.confirmRemove(g)} title="Eliminar">
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `);
                            }}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }
}
