import { html } from '@deijose/nix-js';
import type { NixTemplate } from '@deijose/nix-js';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from '../Toast';
import { ConfirmModal } from '../ConfirmModal';

export function AppLayout(content: NixTemplate): NixTemplate {
  return html`
        <div class="app-layout">
            ${Sidebar()}
            <div class="main-content">
                ${TopBar()}
                <main class="page-content">${content}</main>
            </div>
            ${ToastContainer()}
            ${ConfirmModal()}
        </div>
    `;
}
