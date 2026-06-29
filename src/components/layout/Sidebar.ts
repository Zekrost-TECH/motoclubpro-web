import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { router } from '../../router';
import { currentUser, logout } from '../../stores/auth.store';
import { activeClub } from '../../stores/clubs.store';
import { mobileMenuOpen, closeMobileMenu } from '../../stores/ui.store';
import { routerPath } from '../../stores/router.store';

interface NavItem { label: string; path: string; icon: string; admin?: boolean; }

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'speedometer-outline' },
    { label: 'Rodadas', path: '/events', icon: 'flag-outline' },
    { label: 'Rutas', path: '/routes', icon: 'map-outline' },
    { label: 'Miembros', path: '/members', icon: 'people-outline' },
    { label: 'Puntos de Apoyo', path: '/support', icon: 'location-outline' },
    { label: 'Suscripción', path: '/billing', icon: 'card-outline', admin: true },
    { label: 'Reportes', path: '/reports', icon: 'bar-chart-outline', admin: true },
    { label: 'Configuración', path: '/settings', icon: 'settings-outline', admin: true },
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
                ${() => navItems.map(item => html`
                    <a class=${() => `sidebar-nav-item ${isActiveRoute(item.path, routerPath.value) ? 'active' : ''}`}
                       href=${item.path}
                       @click.prevent=${() => { router.navigate(item.path); closeMobileMenu(); }}>
                        <ion-icon name=${item.icon}></ion-icon>
                        <span>${item.label}</span>
                    </a>
                `)}
            </nav>
            <div class="sidebar-footer">
                <div class="avatar avatar-sm">${getInitials(user?.name || user?.email)}</div>
                <div class="sidebar-user">
                    <span class="sidebar-user-name">${user?.name || user?.email || 'Usuario'}</span>
                    <span class="sidebar-user-role">${user?.role || 'piloto'}</span>
                </div>
                <button class="sidebar-logout" @click=${() => { logout(); router.navigate('/login'); }} title="Cerrar sesión">
                    <ion-icon name="log-out-outline"></ion-icon>
                </button>
            </div>
        </aside>
    `;
}
