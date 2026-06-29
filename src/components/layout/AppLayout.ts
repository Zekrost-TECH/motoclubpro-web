import { html, RouterView, NixComponent } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';

export class AppLayout extends NixComponent {
    private nestedRouter = new RouterView(1);

    render(): NixTemplate {
        return html`
        <div class="app-layout">
            ${Sidebar()}
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
