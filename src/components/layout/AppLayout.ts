import { html, RouterView, NixComponent } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';
import { mobileMenuOpen, closeMobileMenu } from '../../stores/ui.store';

export class AppLayout extends NixComponent {
    private nestedRouter = new RouterView(1);

    render(): NixTemplate {
        return html`
        <div class="app-layout">
            ${Sidebar()}
            <div class=${() => "mobile-menu-overlay " + (mobileMenuOpen.value ? 'open' : '')} @click=${closeMobileMenu}></div>
            <div class="main-content">
                ${TopBar()}
                <main class="page-content">${this.nestedRouter}</main>
            </div>
            ${ToastContainer()}
            ${ConfirmModal()}
        </div>
    `;
    }
}
