import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { router } from '../../router';
import { currentUser, logout } from '../../stores/auth.store';
import { activeClub } from '../../stores/clubs.store';
import { mobileMenuOpen, closeMobileMenu } from '../../stores/ui.store';
import { routerPath } from '../../stores/router.store';
import { ROLE_LABELS } from '../../utils/labels';
import { hasFeature } from '../../stores/plans.store';
import type { ClubLimits } from '../../types';

interface NavItem { label: string; path: string; icon: string; admin?: boolean; leader?: boolean; superadmin?: boolean; feature?: keyof ClubLimits['features']; }

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'speedometer-outline' },
    { label: 'Rodadas', path: '/events', icon: 'flag-outline' },
    { label: 'Rutas', path: '/routes', icon: 'map-outline', feature: 'route_library' },
    { label: 'Miembros', path: '/members', icon: 'people-outline' },
    { label: 'Puntos de Apoyo', path: '/support', icon: 'location-outline', feature: 'support_points' },
    { label: 'SOS', path: '/sos', icon: 'warning-outline', feature: 'support_points' },
    { label: 'Roles de Rodada', path: '/ride-roles', icon: 'bicycle-outline', leader: true },
    { label: 'Suscripción', path: '/billing', icon: 'card-outline', admin: true },
    { label: 'Reportes', path: '/reports', icon: 'bar-chart-outline', admin: true, feature: 'analytics' },
    { label: 'Configuración', path: '/settings', icon: 'settings-outline', admin: true },
    { label: 'Gestión de Clubs', path: '/admin/clubs', icon: 'business-outline', superadmin: true },
];

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function isActiveRoute(path: string, current: string): boolean {
    return current === path || current.startsWith(path + '/');
}

export function Sidebar(): NixTemplate {
    const user = currentUser.value;

    return html`
        <aside class=${() => `sidebar ${mobileMenuOpen.value ? 'open' : ''}`}>
            <div class="sidebar-header">
                <img src="/nix-js-logo.png" alt="MotoClub Pro" class="sidebar-logo" />
                <h2>MotoClub Pro</h2>
                ${() => activeClub.value
            ? html`<span class="sidebar-club">${activeClub.value.name}</span>`
            : ''}
            </div>
            <nav class="sidebar-nav">
                ${() => {
            const role = currentUser.value?.role || 'rider';
            const isSuperadmin = role === 'superadmin';
            return navItems
                .filter(item => !item.admin || isSuperadmin || role === 'admin' || role === 'leader')
                .filter(item => !item.leader || isSuperadmin || role === 'admin' || role === 'leader')
                .filter(item => !item.superadmin || isSuperadmin)
                .filter(item => !item.feature || isSuperadmin || hasFeature(item.feature))
                .map(item => html`
                            <a class=${() => `sidebar-nav-item ${isActiveRoute(item.path, routerPath.value) ? 'active' : ''}`}
                               href=${item.path}
                               @click.prevent=${() => { router.navigate(item.path); closeMobileMenu(); }}>
                                <ion-icon name=${item.icon}></ion-icon>
                                <span>${item.label}</span>
                            </a>
                        `);
        }}
            </nav>
            <div class="sidebar-footer">
                <div class="avatar avatar-sm">${getInitials(user?.name || user?.email)}</div>
                <div class="sidebar-user">
                    <span class="sidebar-user-name">${user?.name || user?.email || 'Usuario'}</span>
                    <span class="sidebar-user-role">${user?.role ? ROLE_LABELS[user.role] || user.role : 'Miembro'}</span>
                </div>
                <button class="sidebar-logout" @click=${() => { logout(); router.navigate('/login'); }} title="Cerrar sesión">
                    <ion-icon name="log-out-outline"></ion-icon>
                </button>
            </div>
        </aside>
    `;
}
