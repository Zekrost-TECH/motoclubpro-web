import { router } from '../../router';
import { html, NixComponent, createForm, repeat } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import type { Event as EventModel, EventAttendee, ChecklistItem, InventoryItem, RideRole, Route, ClubRideRole } from '../../types';
import { showToast } from '../../components/Toast';
import { setPageTitle } from '../../stores/router.store';
import { openConfirm } from '../../components/ConfirmModal';
import { formatEnum, buildRideRoleLabels } from '../../utils/labels';
import { hasFeature } from '../../stores/plans.store';

export class EventDetailPage extends NixComponent {
    private router = router;
    private eventId = this.router.params.value?.id || '';

    invForm = createForm(
        { name: '', category: 'herramienta', quantity: 1 },
        {
            validators: { name: [] },
            validateOn: 'blur',
        }
    );
    checklistForm = createForm(
        { label: '', required: 'true' },
        {
            validators: { label: [] },
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
    attendeesQuery = createQuery(
        'events/attendees',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.attendees(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    checklistQuery = createQuery(
        'events/checklist',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.checklist(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    inventoryQuery = createQuery(
        'events/inventory',
        async ({ id }: { id: string }) => {
            if (!id) throw new Error('No hay rodada seleccionada');
            return api.events.inventory(id);
        },
        {
            params: () => ({ id: this.router.params.value?.id || '' }),
            staleTime: 30_000,
        }
    );
    routesQuery = createQuery(
        'routes/list',
        () => api.routes.list(),
        { staleTime: 60_000 }
    );
    rideRolesQuery = createQuery(
        'ride-roles/list',
        () => api.rideRoles.list(),
        { staleTime: 60_000 }
    );
    addInventory = createCommand(
        'events/inventory/add',
        async (payload: { eventId: string; item: any }) => api.events.addInventoryItem(payload.eventId, payload.item),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/inventory'),
        }
    );
    removeInventory = createCommand(
        'events/inventory/remove',
        async (payload: { eventId: string; itemId: string }) =>
            api.events.removeInventoryItem(payload.eventId, payload.itemId),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/inventory'),
        }
    );
    updateEventStatus = createCommand(
        'events/status/update',
        async (payload: { eventId: string; status: EventModel['status'] }) =>
            api.events.updateStatus(payload.eventId, payload.status),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('events/detail');
                invalidateQueries('events/list');
            },
        }
    );
    setRole = createCommand(
        'events/attendees/setRole',
        async (payload: { eventId: string; userId: string; role: RideRole }) =>
            api.events.setRole(payload.eventId, payload.userId, payload.role),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/attendees'),
        }
    );
    addChecklist = createCommand(
        'events/checklist/add',
        async (payload: { eventId: string; item: { label: string; required: boolean } }) =>
            api.events.addChecklistItem(payload.eventId, payload.item),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/checklist'),
        }
    );
    removeChecklist = createCommand(
        'events/checklist/remove',
        async (payload: { eventId: string; itemId: string }) =>
            api.events.removeChecklistItem(payload.eventId, payload.itemId),
        {
            mode: 'latest',
            onSuccess: () => invalidateQueries('events/checklist'),
        }
    );

    onMount() {
        setPageTitle('Detalle de Rodada');
    }

    onUnmount() {
        this.invForm.dispose();
        this.checklistForm.dispose();
    }

    get event() { return this.eventQuery.data.value as EventModel | null; }
    get attendees() { return this.attendeesQuery.data.value as EventAttendee[] || []; }
    get checklist() { return this.checklistQuery.data.value as ChecklistItem[] || []; }
    get inventory() { return this.inventoryQuery.data.value as InventoryItem[] || []; }
    get eventRoute() {
        return (this.routesQuery.data.value || []).find((r: Route) => r.id === this.event?.routeId) || null;
    }

    async addInventoryItem() {
        try {
            await this.addInventory.executeAsync({
                eventId: this.eventId,
                item: {
                    name: this.invForm.fields.name.value.value,
                    category: this.invForm.fields.category.value.value,
                    quantity: Number(this.invForm.fields.quantity.value.value),
                },
            });
            showToast('Item agregado', 'success');
            this.invForm.reset({ name: '', category: 'herramienta', quantity: 1 });
        } catch (err: any) {
            showToast(err.message || 'Error al agregar', 'error');
        }
    }

    confirmRemoveInventory(itemId: string) {
        openConfirm('Eliminar Item', '¿Eliminar este item del inventario?', () => {
            this.removeInventory.execute({ eventId: this.eventId, itemId });
        });
    }

    async addChecklistItem() {
        try {
            await this.addChecklist.executeAsync({
                eventId: this.eventId,
                item: {
                    label: this.checklistForm.fields.label.value.value,
                    required: this.checklistForm.fields.required.value.value === 'true',
                },
            });
            showToast('Item agregado', 'success');
            this.checklistForm.reset({ label: '', required: 'true' });
        } catch (err: any) {
            showToast(err.message || 'Error al agregar', 'error');
        }
    }

    confirmRemoveChecklist(itemId: string) {
        openConfirm('Eliminar Item', '¿Eliminar este item del checklist?', () => {
            this.removeChecklist.execute({ eventId: this.eventId, itemId });
        });
    }

    async handleStatusChange(status: EventModel['status']) {
        try {
            await this.updateEventStatus.executeAsync({ eventId: this.eventId, status });
            showToast('Estado actualizado', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error al actualizar estado', 'error');
        }
    }

    private validTransitions: Record<EventModel['status'], EventModel['status'][]> = {
        borrador: ['proximo', 'cancelado'],
        proximo: ['en_curso', 'cancelado'],
        en_curso: ['completado', 'cancelado'],
        completado: [],
        cancelado: [],
    };

    isValidStatusOption(status: EventModel['status']): boolean {
        const current = this.event?.status || 'borrador';
        return status === current || this.validTransitions[current]?.includes(status) || false;
    }

    confirmSetRole(userId: string, userName: string, newRole: RideRole) {
        const roles = this.rideRolesQuery.data.value ?? [];
        const labels = buildRideRoleLabels(roles);
        const roleLabel = labels[newRole] || formatEnum(newRole);
        openConfirm('Cambiar rol', `¿Asignar el rol "${roleLabel}" a ${userName}?`, () => {
            this.setRole.execute({ eventId: this.eventId, userId, role: newRole });
        });
    }

    difficultyBadge(difficulty: string): string {
        switch (difficulty) {
            case 'suave': return 'badge-success';
            case 'moderado': return 'badge-warning';
            case 'expertos': return 'badge-danger';
            case 'viaje_largo': return 'badge-info';
            default: return 'badge';
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">${() => this.event?.title || 'Detalle de Rodada'}</h1>
                <p class="page-subtitle">${() => this.event ? `${new Date(this.event.date).toLocaleDateString('es-CO')} · ${this.event.meetingPoint}` : ''}</p>
            </div>
            <div class="page-header-actions" style="display:flex;align-items:center;gap:var(--mc-space-3);">
                <button class="btn btn-secondary" @click=${() => this.router.navigate('/events')}>
                    <ion-icon name="arrow-back-outline"></ion-icon> Volver
                </button>
                <select class="input" value=${() => this.event?.status || 'borrador'} @change=${(e: Event) => this.handleStatusChange((e.target as HTMLSelectElement).value as EventModel['status'])} style="height:40px;min-width:150px;padding:0 var(--mc-space-4) 0 var(--mc-space-3);">
                    <option value="borrador" disabled=${() => !this.isValidStatusOption('borrador')}>Borrador</option>
                    <option value="proximo" disabled=${() => !this.isValidStatusOption('proximo')}>Próximo</option>
                    <option value="en_curso" disabled=${() => !this.isValidStatusOption('en_curso')}>En curso</option>
                    <option value="completado" disabled=${() => !this.isValidStatusOption('completado')}>Completado</option>
                    <option value="cancelado" disabled=${() => !this.isValidStatusOption('cancelado')}>Cancelado</option>
                </select>
                <button class="btn btn-primary" @click=${() => this.router.navigate(`/events/${this.eventId}/edit`)}>
                    <ion-icon name="create-outline"></ion-icon> Editar
                </button>
            </div>
        </div>
        ${() => {
                const e = this.event;
                if (!e) return html`<div class="empty"><ion-icon name="flag-outline" class="empty-icon"></ion-icon><h4>Cargando...</h4></div>`;
                return html`
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="information-circle-outline"></ion-icon> Información General</h3></div>
                        <div class="card-body">
                            <div class="stat-list">
                                <div class="stat-item"><span>Fecha</span><strong>${new Date(e.date).toLocaleDateString('es-CO')}</strong></div>
                                <div class="stat-item"><span>Hora</span><strong>${e.time}</strong></div>
                                <div class="stat-item"><span>Punto de Encuentro</span><strong>${e.meetingPoint}</strong></div>
                                <div class="stat-item"><span>Dificultad</span><strong><span class=${`badge ${this.difficultyBadge(e.difficulty)}`}>${formatEnum(e.difficulty)}</span></strong></div>
                                <div class="stat-item"><span>Estado</span><strong><span class=${`badge badge-${e.status}`}>${formatEnum(e.status)}</span></strong></div>
                            </div>
                            <p style="margin-top:var(--mc-space-4);color:var(--mc-text-secondary);">${e.description || 'Sin descripción'}</p>
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="map-outline"></ion-icon> Ruta</h3></div>
                        <div class="card-body">
                            ${() => {
                        const route = this.eventRoute;
                        if (!route) return html`<div class="empty"><ion-icon name="map-outline" class="empty-icon"></ion-icon><h4>Sin ruta asociada</h4></div>`;
                        return html`
                                    <div class="stat-list">
                                        <div class="stat-item"><span>Nombre</span><strong>${route.name}</strong></div>
                                        <div class="stat-item"><span>Distancia</span><strong>${route.distance || route.distanceKm || 0} km</strong></div>
                                        <div class="stat-item"><span>Dificultad</span><strong><span class="badge ${this.difficultyBadge(route.difficulty)}">${formatEnum(route.difficulty)}</span></strong></div>
                                        <div class="stat-item"><span>Paradas</span><strong>${route.waypointsCount ?? route.waypoints_count ?? 0}</strong></div>
                                    </div>
                                    <p style="margin-top:var(--mc-space-4);color:var(--mc-text-secondary);">${route.description || 'Sin descripción'}</p>
                                    <div style="margin-top:var(--mc-space-4);">
                                        <button class="btn btn-sm btn-secondary" @click=${() => this.router.navigate(`/routes/${route.id}`)}>Ver Ruta</button>
                                    </div>
                                `;
                    }}
                        </div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header"><h3><ion-icon name="people-outline"></ion-icon> Asistentes (${this.attendees.length || 0})</h3></div>
                        <div class="card-body">
                            <div class="data-table-wrapper">
                                <table class="data-table">
                                    <thead><tr><th>Nombre</th><th>Rol en Rodada</th><th>Confirmado</th><th></th></tr></thead>
                                    <tbody>
                                        ${() => {
                        const list = this.attendees;
                        if (!list.length) return html`<tr><td colspan="4" class="empty">Sin asistentes registrados.</td></tr>`;
                        return repeat(list, (a: EventAttendee) => a.userId, (a: EventAttendee) => html`
                                                <tr>
                                                    <td>${a.userName}</td>
                                                    <td>
                                                        <select class="input" value=${() => a.rideRole} @change=${(e: Event) => this.confirmSetRole(a.userId, a.userName, (e.target as HTMLSelectElement).value as RideRole)} style="height:32px;min-width:160px;padding:0 var(--mc-space-3);">
                                                            ${() => {
                                const roles = this.rideRolesQuery.data.value ?? [];
                                return roles.length
                                    ? roles.map((r: ClubRideRole) => html`<option value="${r.slug}">${r.name}</option>`)
                                    : html`<option value="${a.rideRole}">${a.rideRole}</option>`;
                            }}
                                                        </select>
                                                    </td>
                                                    <td><ion-icon name=${a.confirmed ? 'checkmark-circle' : 'time-outline'} style=${a.confirmed ? 'color:var(--mc-success-500)' : 'color:var(--mc-text-muted)'}></ion-icon></td>
                                                    <td></td>
                                                </tr>
                                            `);
                    }}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                ${() => hasFeature('checklist') ? html`
                <div class="dashboard-card" style="margin-top:var(--mc-space-6);">
                    <div class="card-header"><h3><ion-icon name="checkbox-outline"></ion-icon> Checklist de Equipamiento</h3></div>
                    <div class="card-body">
                        <form style="display:flex;gap:var(--mc-space-3);margin-bottom:var(--mc-space-4);align-items:flex-end;" @submit.prevent=${() => this.addChecklistItem()}>
                            <div class="form-group" style="flex:1;margin-bottom:0;">
                                <label>Item</label>
                                <input type="text" value=${() => this.checklistForm.fields.label.value.value} @input=${this.checklistForm.fields.label.onInput} placeholder="Ej. Casco" required />
                            </div>
                            <div class="form-group" style="width:120px;margin-bottom:0;">
                                <label>Obligatorio</label>
                                <select value=${() => this.checklistForm.fields.required.value.value} @change=${this.checklistForm.fields.required.onInput}>
                                    <option value="true">Sí</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-sm btn-primary" disabled=${() => this.addChecklist.isPending.value || this.checklistForm.isSubmitting.value} style="height:38px;">
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </form>
                        <div class="data-table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>Item</th><th>Obligatorio</th><th></th></tr></thead>
                                <tbody>
                                    ${() => {
                            const list = this.checklist;
                            if (!list.length) return html`<tr><td colspan="3" class="empty">Sin items de checklist.</td></tr>`;
                            return repeat(list, (item: ChecklistItem) => item.id, (item: ChecklistItem) => html`
                                            <tr>
                                                <td><strong>${item.label}</strong></td>
                                                <td><span class=${`badge ${item.required ? 'badge-danger' : 'badge'}`}>${item.required ? 'Obligatorio' : 'Opcional'}</span></td>
                                                <td>
                                                    <button class="btn-icon danger" @click=${() => this.confirmRemoveChecklist(item.id)}>
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
                </div>` : ''}
                ${() => hasFeature('event_inventory') ? html`
                <div class="dashboard-card" style="margin-top:var(--mc-space-6);">
                    <div class="card-header"><h3><ion-icon name="cube-outline"></ion-icon> Inventario Compartido</h3></div>
                    <div class="card-body">
                        <form style="display:flex;gap:var(--mc-space-3);margin-bottom:var(--mc-space-4);align-items:flex-end;" @submit.prevent=${() => this.addInventoryItem()}>
                            <div class="form-group" style="flex:1;margin-bottom:0;">
                                <label>Item</label>
                                <input type="text" value=${() => this.invForm.fields.name.value.value} @input=${this.invForm.fields.name.onInput} placeholder="Ej. Kit de herramientas" required />
                            </div>
                            <div class="form-group" style="width:120px;margin-bottom:0;">
                                <label>Categoría</label>
                                <select value=${() => this.invForm.fields.category.value.value} @change=${this.invForm.fields.category.onInput}>
                                    <option value="herramienta">Herramienta</option>
                                    <option value="seguridad">Seguridad</option>
                                    <option value="comida">Comida</option>
                                    <option value="otros">Otros</option>
                                </select>
                            </div>
                            <div class="form-group" style="width:80px;margin-bottom:0;">
                                <label>Cant.</label>
                                <input type="number" min="1" value=${() => this.invForm.fields.quantity.value.value} @input=${this.invForm.fields.quantity.onInput} />
                            </div>
                            <button type="submit" class="btn btn-sm btn-primary" disabled=${() => this.addInventory.isPending.value || this.invForm.isSubmitting.value} style="height:38px;">
                                <ion-icon name="add-outline"></ion-icon>
                            </button>
                        </form>
                        <div class="data-table-wrapper">
                            <table class="data-table">
                                <thead><tr><th>Item</th><th>Categoría</th><th>Cantidad</th><th></th></tr></thead>
                                <tbody>
                                    ${() => {
                            const list = this.inventory;
                            if (!list.length) return html`<tr><td colspan="4" class="empty">Sin inventario registrado.</td></tr>`;
                            return repeat(list, (item: InventoryItem) => item.id, (item: InventoryItem) => html`
                                            <tr>
                                                <td><strong>${item.name}</strong></td>
                                                <td><span class="badge">${formatEnum(item.category || '')}</span></td>
                                                <td>${item.quantity || item.totalQuantity || 1}</td>
                                                <td>
                                                    <button class="btn-icon danger" @click=${() => this.confirmRemoveInventory(item.id)}>
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
                </div>` : ''}
            `;
            }}
    `;
    }
}
