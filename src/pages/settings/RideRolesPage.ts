import { html, NixComponent, mount } from '@deijose/nix-js';
import { createQuery, createCommand, invalidateQueries } from '@deijose/nix-query';
import { api } from '../../services/api.service';
import { setPageTitle } from '../../stores/router.store';
import { showToast } from '../../components/Toast';
import { RideRoleModal } from '../../components/RideRoleModal';
import type { ClubRideRole } from '../../types';

export class RideRolesPage extends NixComponent {
    private portalRoot: HTMLElement | null = null;

    rolesQuery = createQuery(
        'ride-roles/list',
        () => api.rideRoles.list(),
        { staleTime: 30_000 }
    );

    createRole = createCommand(
        'ride-roles/create',
        async (payload: { slug: string; name: string; isUnique: boolean; sortOrder: number }) =>
            api.rideRoles.create(payload),
        {
            mode: 'latest',
            onSuccess: () => {
                this.closeModal();
                invalidateQueries('ride-roles/list');
                showToast('Rol creado', 'success');
            },
        }
    );

    updateRole = createCommand(
        'ride-roles/update',
        async (payload: { id: string; slug: string; name: string; isUnique: boolean; sortOrder: number }) =>
            api.rideRoles.update(payload.id, payload),
        {
            mode: 'latest',
            onSuccess: () => {
                this.closeModal();
                invalidateQueries('ride-roles/list');
                showToast('Rol actualizado', 'success');
            },
        }
    );

    deleteRole = createCommand(
        'ride-roles/delete',
        async (id: string) => api.rideRoles.delete(id),
        {
            mode: 'latest',
            onSuccess: () => {
                invalidateQueries('ride-roles/list');
                showToast('Rol eliminado', 'success');
            },
        }
    );

    onMount() {
        setPageTitle('Roles de Rodada');
    }

    onUnmount() {
        this.closeModal();
    }

    private openModal(role: ClubRideRole | null = null) {
        this.closeModal();
        this.portalRoot = document.createElement('div');
        this.portalRoot.className = 'ride-role-modal-portal';
        document.body.appendChild(this.portalRoot);
        mount(
            RideRoleModal({
                role,
                onSave: (payload) => {
                    if (role) {
                        this.updateRole.executeAsync({ id: role.id, ...payload }).catch((err: any) => {
                            showToast(err.message || 'Error al actualizar el rol', 'error');
                        });
                    } else {
                        this.createRole.executeAsync(payload).catch((err: any) => {
                            showToast(err.message || 'Error al crear el rol', 'error');
                        });
                    }
                },
                onClose: () => this.closeModal(),
            }),
            this.portalRoot
        );
    }

    private closeModal() {
        if (this.portalRoot) {
            this.portalRoot.remove();
            this.portalRoot = null;
        }
    }

    render() {
        return html`
        <div class="page-header">
            <div class="page-header-left">
                <h1 class="page-title">Roles de Rodada</h1>
                <p class="page-subtitle">Personaliza los roles de cada rodada para tu club</p>
            </div>
            <div class="page-header-right">
                <button class="btn btn-primary" @click=${() => this.openModal()}>
                    <ion-icon name="add-outline"></ion-icon>
                    <span>Nuevo rol</span>
                </button>
            </div>
        </div>

        <div class="dashboard-card">
            <div class="card-header"><h3>Roles configurados</h3></div>
            <div class="card-body">
                <div class="data-table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Nombre</th><th>Slug</th><th>Único</th><th>Orden</th><th></th></tr></thead>
                        <tbody>
                            ${() => {
                const roles = this.rolesQuery.data.value ?? [];
                if (!roles.length) return html`<tr><td colspan="5" class="empty">No hay roles configurados.</td></tr>`;
                return roles.map((r: ClubRideRole) => html`
                                <tr>
                                    <td><strong>${r.name}</strong></td>
                                    <td><code>${r.slug}</code></td>
                                    <td>${r.isUnique ? 'Sí' : 'No'}</td>
                                    <td>${r.sortOrder}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn-icon" @click=${() => this.openModal(r)} title="Editar"><ion-icon name="create-outline"></ion-icon></button>
                                            <button class="btn-icon danger" @click=${() => this.deleteRole.execute(r.id)} title="Eliminar"><ion-icon name="trash-outline"></ion-icon></button>
                                        </div>
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
