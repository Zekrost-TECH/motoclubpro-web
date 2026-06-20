import { signal, html, mount } from "@deijose/nix-js";
import type { NixTemplate } from "@deijose/nix-js";

function App(): NixTemplate {
    const count = signal<number>(0);

    return html`
        <main>
            <h1><img src="/nix-js-logo.png" alt="Nix.js Logo" /> Nix.js + Vite + TypeScript</h1>
            <button @click=${() => count.update((c: number) => c + 1)}>
                Clicks: ${() => count.value}
            </button>
        </main>
    `;
}

mount(App(), "#app");