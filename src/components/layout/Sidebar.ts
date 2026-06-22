import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { router, currentPath } from '../../router';
import { activeClub } from '../../stores/clubs.store';

interface NavItem { label: string; icon: string; path: string; admin?: boolean; }

const navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'speedometer', path: '/' },
    { label: 'Rodadas', icon: 'calendar', path: '/events' },
    { label: 'Rutas', icon: 'map', path: '/routes' },
    { label: 'Miembros', icon: 'people', path: '/members' },
    { label: 'Puntos de Apoyo', icon: 'build', path: '/support' },
    { label: 'Suscripción', icon: 'card', path: '/billing', admin: true },
    { label: 'Reportes', icon: 'bar-chart', path: '/reports', admin: true },
    { label: 'Configuración', icon: 'settings', path: '/settings', admin: true },
];

export function Sidebar(): NixTemplate {
    return html`
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="/nix-js-logo.png" alt="MotoClub Pro" class="sidebar-logo" />
                <h2>MotoClub Pro</h2>
                ${() => activeClub.value
            ? html`<span class="sidebar-club">${activeClub.value.name}</span>`
            : ''}
            </div>
            <nav class="sidebar-nav">
                ${navItems.map(item => html`
                    <a class=${() => `nav-item ${currentPath.value === item.path ? 'active' : ''}`}
                       @click=${() => router.navigate(item.path)}>
                        <ion-icon name="${item.icon}-outline"></ion-icon>
                        <span>${item.label}</span>
                    </a>
                `)}
            </nav>
            <div class="sidebar-footer">
                <span>v0.1.0</span>
            </div>
        </aside>
    `;
}
