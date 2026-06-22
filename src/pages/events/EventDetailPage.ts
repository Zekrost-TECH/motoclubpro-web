import { html, signal, effect } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { api } from '../../services/api.service';
import { router } from '../../router';
import { showToast } from '../../components/Toast';
import { openConfirm } from '../../components/ConfirmModal';

export function EventDetailPage(eventId: string): NixTemplate {
    document.title = 'Detalle de Rodada | MotoClub Pro';
    const event = signal<any>(null);
    const attendees = signal<any[]>([]);
    const checklist = signal<any[]>([]);
    const inventory = signal<any[]>([]);
    const invName = signal('');
    const invCategory = signal('herramienta');
    const invQuantity = signal(1);
    const addingInv = signal(false);

    function refresh() {
        api.events.get(eventId).then(e => event.update(() => e)).catch(() => { });
        api.events.attendees(eventId).then(a => attendees.update(() => a)).catch(() => { });
        api.events.checklist(eventId).then(c => checklist.update(() => c)).catch(() => { });
        api.events.inventory(eventId).then(i => inventory.update(() => i)).catch(() => { });
    }

    effect(() => { refresh(); });

    async function addInventoryItem() {

        addingInv.update(() => true);
        try {
            await api.events.addInventoryItem(eventId, {
                name: invName.value,
                category: invCategory.value,
                quantity: Number(invQuantity.value),
            });
            showToast('Item agregado', 'success');
            invName.update(() => '');
            invQuantity.update(() => 1);
            refresh();
        } catch (err: any) {
            showToast(err.message || 'Error al agregar', 'error');
        } finally {
            addingInv.update(() => false);
        }
    }

    function confirmRemoveInventory(itemId: string) {
        openConfirm('Eliminar Item', '¿Eliminar este item del inventario?', () => {
            api.events.removeInventoryItem(eventId, itemId).then(() => {
                showToast('Item eliminado', 'success');
                refresh();
            }).catch(() => showToast('Error al eliminar', 'error'));
        });
    }

    return html`
        <div class="page-header">
            <h2>${() => event.value?.title || 'Detalle de Rodada'}</h2>
            <div class="toolbar">
                <button class="btn" @click=${() => router.navigate('/events')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
                <button class="btn btn-primary" @click=${() => router.navigate(`/events/${eventId}/edit`)}>
                    <ion-icon name="create-outline"></ion-icon> Editar
                </button>
            </div>
        </div>
        ${() => {
            const e = event.value;
            if (!e) return html`<p class="empty">Cargando...</p>`;
            return html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Información General</h3></div>
                        <div class="card-body">
                            <p><strong>Fecha:</strong> ${new Date(e.date).toLocaleDateString('es-CO')}</p>
                            <p><strong>Hora:</strong> ${e.time}</p>
                            <p><strong>Punto de Encuentro:</strong> ${e.meetingPoint}</p>
                            <p><strong>Dificultad:</strong> <span class="badge">${e.difficulty}</span></p>
                            <p><strong>Estado:</strong> <span class="badge badge-${e.status}">${e.status}</span></p>
                            <p><strong>Descripción:</strong> ${e.description || '-'}</p>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3>Asistentes (${attendees.value?.length || 0})</h3></div>
                        <div class="card-body">
                            <table class="data-table">
                                <thead><tr><th>Nombre</th><th>Rol en Rodada</th><th>Confirmado</th></tr></thead>
                                <tbody>
                                    ${() => {
                    const list = attendees.value || [];
                    if (!list.length) return html`<tr><td colspan="3" class="empty">Sin asistentes registrados.</td></tr>`;
                    return list.map((a: any) => html`
                                            <tr>
                                                <td>${a.userName}</td>
                                                <td><span class="badge">${a.rideRole}</span></td>
                                                <td>${a.confirmed ? '✅' : '⏳'}</td>
                                            </tr>
                                        `);
                }}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card" style="margin-top:1.5rem;">
                    <div class="card-header"><h3>Checklist de Equipamiento</h3></div>
                    <div class="card-body">
                        ${() => {
                    const list = checklist.value || [];
                    if (!list.length) return html`<p class="empty">Sin items de checklist.</p>`;
                    return list.map((item: any) => html`
                                <div class="list-item" style="display:flex;justify-content:space-between;">
                                    <span>${item.label}</span>
                                    <span class="badge">${item.required ? 'Obligatorio' : 'Opcional'}</span>
                                </div>
                            `);
                }}
                    </div>
                </div>
                <div class="dashboard-card" style="margin-top:1.5rem;">
                    <div class="card-header"><h3>Inventario Compartido</h3></div>
                    <div class="card-body">
                        <form style="display:flex;gap:0.5rem;margin-bottom:1rem;align-items:flex-end;" @submit.prevent=${addInventoryItem}>
                            <div class="form-group" style="flex:1;margin-bottom:0;">
                                <label style="font-size:0.8rem;">Item</label>
                                <input type="text" .value=${() => invName.value} @input=${(e: any) => invName.update(() => e.target.value)} placeholder="Ej. Kit de herramientas" required />
                            </div>
                            <div class="form-group" style="width:120px;margin-bottom:0;">
                                <label style="font-size:0.8rem;">Categoría</label>
                                <select .value=${() => invCategory.value} @change=${(e: any) => invCategory.update(() => e.target.value)}>
                                    <option value="herramienta">Herramienta</option>
                                    <option value="seguridad">Seguridad</option>
                                    <option value="comida">Comida</option>
                                    <option value="otros">Otros</option>
                                </select>
                            </div>
                            <div class="form-group" style="width:80px;margin-bottom:0;">
                                <label style="font-size:0.8rem;">Cant.</label>
                                <input type="number" min="1" .value=${() => invQuantity.value} @input=${(e: any) => invQuantity.update(() => Number(e.target.value))} />
                            </div>
                            <button type="submit" class="btn btn-sm btn-primary" ?disabled=${() => addingInv.value} style="height:38px;">
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </form>
                        <table class="data-table">
                            <thead><tr><th>Item</th><th>Categoría</th><th>Cantidad</th><th></th></tr></thead>
                            <tbody>
                                ${() => {
                    const list = inventory.value || [];
                    if (!list.length) return html`<tr><td colspan="4" class="empty">Sin inventario registrado.</td></tr>`;
                    return list.map((item: any) => html`
                                        <tr>
                                            <td><strong>${item.name}</strong></td>
                                            <td><span class="badge">${item.category}</span></td>
                                            <td>${item.quantity || item.totalQuantity || 1}</td>
                                            <td>
                                                <button class="btn-icon btn-danger" @click=${() => confirmRemoveInventory(item.id)}>
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </td>
                                        </tr>
                                    `);
                }}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }}
    `;
}
