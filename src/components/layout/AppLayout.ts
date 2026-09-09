import { html, RouterView, ElurComponent } from '@elurjs/core';
import type { ElurTemplate } from '@elurjs/core';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';
import { mobileMenuOpen, closeMobileMenu } from '../../stores/ui.store';

export class AppLayout extends ElurComponent {
    private nestedRouter = new RouterView(1);

    render(): ElurTemplate {
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
