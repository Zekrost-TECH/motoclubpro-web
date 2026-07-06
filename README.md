# BikerOS Web Admin

Panel de administracion web para BikerOS. Permite a administradores y lideres gestionar clubes, rodadas, rutas, miembros, puntos de apoyo, suscripciones y alertas SOS desde el navegador.

## Stack Tecnologico

| Tecnologia | Version | Proposito |
|---|---|---|
| Nix.js | ^2.5.0 | Framework UI reactivo (signals, templates, router) |
| Vite | ^8.0.0 | Bundler y dev server con HMR |
| TypeScript | ~5.9.3 | Tipado estatico |
| CSS Variables | - | Sistema de diseno sin framework CSS |
| IonIcons | ^8.0.13 | Iconografia SVG |

## Arquitectura

- **Sin Virtual DOM:** Nix.js actualiza nodos DOM individuales directamente via bindings reactivos.
- **Hash Router:** `mode: 'hash'` para compatibilidad con hosting estatico (S3, Netlify, etc.).
- **Signals:** Estado reactivo con `signal()`, `effect()`, y `html\`\`` templates.
- **Stores:** `createStore` para auth y clubs.
- **API Client:** Wrapper `fetch` con interceptores 401/403 y redireccion automatica a login.

## Caracteristicas

- **Dashboard:** KPIs en tiempo real, alertas SOS activas, rodadas proximas.
- **Rodadas (Events):** CRUD completo, asistentes, checklist, inventario compartido.
- **Rutas (Routes):** Edicion con waypoints (GeoJSON), visualizacion en Google Maps.
- **Miembros:** Lista, invitacion, perfiles con info medica.
- **Puntos de Apoyo:** Verificacion de talleres, llanterias, gasolineras.
- **Suscripcion y Billing:** Datos de facturacion, historial de pagos WomPI.
- **Reportes:** Metricas de rodadas, SOS y miembros.
- **Configuracion:** Edicion de datos del club.

## Estructura del Proyecto

```
src/
|-- components/
|   |-- layout/
|   |   |-- AppLayout.ts      # Shell: sidebar + topbar + toast + modal
|   |   |-- Sidebar.ts        # Navegacion lateral
|   |   |-- TopBar.ts         # Barra superior
|   |-- ConfirmModal.ts       # Modal de confirmacion global
|   |-- MapView.ts            # Google Maps para rutas
|   |-- Skeleton.ts           # Loading placeholders
|   |-- Toast.ts              # Notificaciones toast
|
|-- pages/
|   |-- auth/
|   |   |-- LoginPage.ts
|   |-- clubs/
|   |   |-- ClubSelectorPage.ts
|   |-- dashboard/
|   |   |-- DashboardPage.ts
|   |-- events/
|   |   |-- EventsListPage.ts
|   |   |-- EventCreatePage.ts
|   |   |-- EventDetailPage.ts
|   |   |-- EventEditPage.ts
|   |-- routes/
|   |   |-- RoutesListPage.ts
|   |   |-- RouteCreatePage.ts
|   |   |-- RouteDetailPage.ts
|   |   |-- RouteEditPage.ts
|   |-- members/
|   |   |-- MembersListPage.ts
|   |   |-- MemberInvitePage.ts
|   |   |-- MemberProfilePage.ts
|   |-- support/
|   |   |-- SupportPointsPage.ts
|   |-- billing/
|   |   |-- BillingPage.ts
|   |-- reports/
|   |   |-- ReportsPage.ts
|   |-- settings/
|   |   |-- SettingsPage.ts
|
|-- services/
|   |-- api.service.ts        # Cliente HTTP + endpoints
|
|-- stores/
|   |-- auth.store.ts         # Estado de autenticacion
|   |-- clubs.store.ts        # Estado de clubes
|
|-- main.ts                   # Entry point: bootstrap + routing
|-- router.ts                 # Configuracion de router + guards
|-- style.css                 # Estilos globales y componentes
|-- types.ts                  # Interfaces compartidas
```

## Requisitos

- Bun 1.3+ (o Node.js 20+)
- Backend API corriendo (ver `biker-os-api/`)

## Instalacion

```bash
cd biker-os-web

# Dependencias
bun install

# Variables de entorno
# Crear .env en la raiz del proyecto:
# VITE_WEB_API_URL=http://localhost:3000/api/v1
# VITE_GOOGLE_MAPS_API_KEY=tu_api_key

# Desarrollo
bun run dev
```

La web estara en `http://localhost:5173`.

## Scripts

```bash
bun run dev        # Desarrollo con HMR
bun run build      # Build de produccion (tsc + vite)
bun run preview    # Preview local del build
```

## Variables de Entorno

| Variable | Descripcion |
|---|---|
| `VITE_WEB_API_URL` | URL base del backend API |
| `VITE_GOOGLE_MAPS_API_KEY` | API key para Google Maps |

> **Nota:** Vite requiere el prefijo `VITE_` para exponer variables al frontend.

## Convenciones Nix.js

- Templates: `html\`\`` (nunca JSX)
- Eventos: `@submit.prevent=${handler}`, `@click.stop=${handler}`
- Atributos reactivos: `class=${() => \`badge badge-${status.value}\`}`
- Formularios: binding via `.value=${() => signal.value}` + `@input=${(e) => signal.update(...)}`
- Listas dinamicas: usar `repeat()` (importado de `@deijose/nix-js`)

## Build para Produccion

```bash
bun run build
```

Genera archivos estaticos en `dist/`:
- `index.html`
- `assets/index-*.js`
- `assets/index-*.css`

Compatible con cualquier hosting estatico (Netlify, Vercel, S3, CloudFront).

## Documentacion Relacionada

- [Documentacion Tecnica Completa](../../docs/WEB-TECHNICAL-DOCUMENTATION.md)
- [Guia de Desarrollo Local](../../docs/LOCAL-DEVELOPMENT-GUIDE.md)
- [Guia de Despliegue a Produccion](../../docs/PRODUCTION-DEPLOYMENT-GUIDE.md)

## Licencia

UNLICENSED — Software comercial privado.
