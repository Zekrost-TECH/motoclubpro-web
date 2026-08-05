import { defineConfig, loadEnv } from "vite";
import nixjs from "@deijose/vite-plugin-nix-js";

// Inyecta la Content-Security-Policy (meta) solo en builds de producción.
// En dev se omite para no romper HMR ni el dev server.
// La URL de la API se toma de VITE_WEB_API_URL en tiempo de build.
function cspPlugin() {
  return {
    name: "inject-csp",
    transformIndexHtml(html: string, ctx: { server?: unknown; mode?: string }) {
      if (ctx.server) return html;
      const mode = ctx.mode ?? "production";
      const env = loadEnv(mode, process.cwd(), "VITE_");
      const apiUrl = env.VITE_WEB_API_URL || "http://localhost:3000/api/v1";

      // Solo el origen (scheme+host): un path sin "/" final en CSP se
      // interpreta como match EXACTO y bloquea el resto de endpoints.
      const apiOrigin = (() => {
        try {
          return new URL(apiUrl).origin;
        } catch {
          return apiUrl;
        }
      })();

      const csp = [
        "default-src 'self'",
        `connect-src 'self' ${apiOrigin} https://cloudflareinsights.com https://challenges.cloudflare.com`,
        "script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://maps.googleapis.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
        "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com",
        "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com",
        "frame-src https://challenges.cloudflare.com",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
      ].join("; ");

      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`,
      );
    },
  };
}

export default defineConfig({
  plugins: [nixjs(), cspPlugin()],
});
