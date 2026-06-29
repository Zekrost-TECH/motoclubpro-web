# MotoClub Pro — Web UI Design System Prompt

## Objective

Redesign the entire **MotoClub Pro** administrative web application to look like a **modern, biker-themed, attractive yet minimalist SaaS admin dashboard**. The system is used by motorcycle club administrators to manage events, routes, members, SOS alerts, billing, reports, and club settings. The visual language must communicate power, trust, community, and speed while remaining highly readable and functional.

This prompt should produce a complete CSS-based design system plus a refreshed layout and components. The app currently uses plain CSS custom properties and vanilla Web Components with `@deijose/nix-js`. Keep the architecture intact: do not introduce React, Tailwind, or other frameworks. Only use CSS custom properties, class naming, and component updates.

---

## 1. Brand Identity & Atmosphere

**Brand name:** MotoClub Pro
**Industry:** Motorcycle clubs / Biker community management
**Vibe:** Rugged, modern, clean, premium but not corporate, dark-mode-first with a bold orange accent.

**Keywords:** asphalt, steel, chrome, fire, leather, freedom, precision, brotherhood.

**Mood:** A dark garage at night with a neon orange accent line from a bike’s headlight — sharp, focused, and powerful.

---

## 2. Color System

Use a dark-first palette. Everything must be defined as CSS custom properties in `:root` and consumed everywhere. Provide semantic tokens and primitive tokens.

### Primitive Colors

```css
--mc-ink-900: #0B0C0E;         /* deepest black — backgrounds */
--mc-ink-800: #12151A;         /* panels, cards */
--mc-ink-700: #1A1E24;         /* elevated surfaces */
--mc-ink-600: #252A32;         /* borders, dividers on dark */
--mc-ink-500: #3B424D;         /* subtle borders */
--mc-ink-400: #6B7280;         /* muted text on dark */
--mc-ink-300: #9CA3AF;         /* secondary text */
--mc-ink-200: #D1D5DB;         /* primary text */
--mc-ink-100: #F3F4F6;         /* white-ish text */
--mc-amber-500: #FF6B00;        /* primary accent — exhaust flame orange */
--mc-amber-400: #FF8A2C;        /* hover accent */
--mc-amber-300: #FFB36B;        /* glow, highlights */
--mc-amber-600: #D95A00;        /* active / pressed */
--mc-danger-500: #EF4444;       /* SOS, errors */
--mc-danger-400: #F87171;       /* danger hover */
--mc-success-500: #22C55E;      /* success / completed */
--mc-success-400: #4ADE80;      /* success hover */
--mc-warning-500: #EAB308;       /* in-progress / warning */
--mc-info-500: #3B82F6;         /* info / links */
--mc-white: #FFFFFF;
--mc-black: #000000;
```

### Semantic Tokens

```css
--mc-bg-body: var(--mc-ink-900);
--mc-bg-panel: var(--mc-ink-800);
--mc-bg-card: var(--mc-ink-700);
--mc-bg-card-hover: var(--mc-ink-600);
--mc-bg-input: var(--mc-ink-800);
--mc-bg-input-focus: var(--mc-ink-700);
--mc-border: rgba(255, 255, 255, 0.08);
--mc-border-strong: rgba(255, 255, 255, 0.14);
--mc-text-primary: var(--mc-ink-100);
--mc-text-secondary: var(--mc-ink-300);
--mc-text-muted: var(--mc-ink-400);
--mc-text-inverse: var(--mc-ink-900);
--mc-accent: var(--mc-amber-500);
--mc-accent-hover: var(--mc-amber-400);
--mc-accent-active: var(--mc-amber-600);
--mc-accent-glow: rgba(255, 107, 0, 0.25);
--mc-danger-bg: rgba(239, 68, 68, 0.12);
--mc-success-bg: rgba(34, 197, 94, 0.12);
--mc-warning-bg: rgba(234, 179, 8, 0.12);
--mc-info-bg: rgba(59, 130, 246, 0.12);
```

---

## 3. Typography

- **Font family:** `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for UI; `Inter` for headings too (do not add external fonts unless the user requests).
- **Base size:** `15px` on desktop, `14px` on mobile.
- **Line height:** `1.5` for body, `1.25` for headings.
- **Weights:** `400` body, `500` labels, `600` buttons/cards, `700` headings/KPIs.

### Type Scale

```css
--mc-text-xs: 0.75rem;    /* 12px */
--mc-text-sm: 0.875rem;   /* 14px */
--mc-text-base: 0.9375rem; /* 15px */
--mc-text-md: 1rem;       /* 16px */
--mc-text-lg: 1.125rem;   /* 18px */
--mc-text-xl: 1.375rem;   /* 22px */
--mc-text-2xl: 1.75rem;   /* 28px */
```

Headings should be crisp, use `letter-spacing: -0.02em` on large headings, and use `color: var(--mc-text-primary)`.

---

## 4. Spacing & Sizing Scale

Use a 4px grid:

```css
--mc-space-1: 0.25rem;   /* 4px */
--mc-space-2: 0.5rem;   /* 8px */
--mc-space-3: 0.75rem;  /* 12px */
--mc-space-4: 1rem;     /* 16px */
--mc-space-5: 1.25rem;  /* 20px */
--mc-space-6: 1.5rem;   /* 24px */
--mc-space-8: 2rem;     /* 32px */
--mc-space-10: 2.5rem;  /* 40px */
--mc-space-12: 3rem;    /* 48px */
```

Layout constants:

```css
--mc-sidebar-width: 260px;
--mc-sidebar-collapsed-width: 72px;
--mc-topbar-height: 64px;
--mc-radius-sm: 6px;
--mc-radius-md: 10px;
--mc-radius-lg: 14px;
--mc-radius-xl: 20px;
--mc-radius-full: 9999px;
```

---

## 5. Shadows & Glows

```css
--mc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
--mc-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.25);
--mc-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
--mc-shadow-amber: 0 0 18px var(--mc-accent-glow);
--mc-shadow-danger: 0 0 18px rgba(239, 68, 68, 0.25);
```

Use the amber glow only on active states, primary buttons, and the current sidebar item.

---

## 6. Layout Architecture

### Sidebar

- Fixed left, `width: var(--mc-sidebar-width)`.
- Background: `var(--mc-bg-panel)` with a subtle right border `var(--mc-border)`.
- Header: logo (40px) with a ring/glow accent, club name, and a small badge for current role.
- Navigation: vertical list with icon + label.
- Nav item: rounded `var(--mc-radius-md)`, hover background `var(--mc-bg-card-hover)`, active state has a left amber accent bar (3px) and a soft amber glow on the background.
- Footer: user mini-card with avatar circle, name, and a logout button.
- On mobile: slide-in drawer over a scrim, full width minus 80px.

### Topbar

- Sticky, `height: var(--mc-topbar-height)`.
- Background: `var(--mc-bg-card)` with subtle bottom border.
- Left: page title + breadcrumb/section subtitle.
- Right: club selector (styled as a dark select), notification icon, user avatar.
- Club selector should look like a button: dark background, border, rounded, with the club name and a chevron.

### Main Content Area

- Background: `var(--mc-bg-body)`.
- Padding: `var(--mc-space-6)` on desktop, `var(--mc-space-4)` on mobile.
- All pages should start with a page header (title + optional action buttons) and then content cards.

---

## 7. Component Library

### Buttons

- **Primary:** `var(--mc-accent)` background, white text, no border. Hover: `var(--mc-accent-hover)` + subtle shadow/glow. Active: `var(--mc-accent-active)`.
- **Secondary:** transparent background, `var(--mc-border-strong)` border, `var(--mc-text-primary)` text. Hover: `var(--mc-bg-card-hover)`.
- **Danger:** transparent background, `var(--mc-danger-500)` text and border. Hover: `var(--mc-danger-bg)`.
- **Ghost:** transparent, no border. Hover: `var(--mc-bg-card-hover)`.
- **Icon button:** 36px square, rounded, centered icon.
- All buttons: `border-radius: var(--mc-radius-md)`, `font-weight: 600`, `padding: 0.6rem 1.1rem`, `gap: 0.5rem`.

### Inputs & Selects

- Background: `var(--mc-bg-input)`.
- Border: `1px solid var(--mc-border)`.
- Text: `var(--mc-text-primary)`.
- Placeholder: `var(--mc-text-muted)`.
- Focus: `border-color: var(--mc-accent)` + `box-shadow: 0 0 0 3px var(--mc-accent-glow)`.
- Disabled: opacity 0.55.
- Labels above inputs: small, `var(--mc-text-secondary)`, `font-weight: 500`, margin-bottom `var(--mc-space-2)`.
- Form groups stacked with `var(--mc-space-4)` gap.

### Cards

- Background: `var(--mc-bg-card)`.
- Border: `1px solid var(--mc-border)`.
- Border-radius: `var(--mc-radius-lg)`.
- Padding: `var(--mc-space-5)`.
- Hover: translateY(-2px) + `var(--mc-shadow-md)` for clickable cards.
- Header inside card: title + optional actions, separated by a subtle bottom border.

### KPI Cards

- Horizontal layout: icon on left, data on right.
- Icon container: 48px rounded square, dark background with accent color. Each KPI type should have a distinct icon and tint.
- Value: `font-size: var(--mc-text-2xl)`, `font-weight: 700`, `color: var(--mc-text-primary)`.
- Label: `var(--mc-text-secondary)`, uppercase, letter-spacing 0.05em, font-size `var(--mc-text-xs)`.
- Trend/chip optional below the value.

### Tables

- Wrapper: card with overflow-x-auto.
- Header row: `var(--mc-bg-panel)` background, `var(--mc-text-secondary)` uppercase text, tiny font, letter-spacing.
- Row: border-bottom `var(--mc-border)`, hover `var(--mc-bg-card-hover)`.
- Cells: padding `var(--mc-space-4)` vertically, `var(--mc-space-5)` horizontally.
- Selection / actions on the rightmost column.

### Badges

- Small pill-shaped labels with rounded-full radius.
- Status badges:
  - `proximo`: amber with low opacity background.
  - `en_curso`: warning yellow.
  - `completado`: success green.
  - `cancelado`: danger red.
  - `activa` (SOS): danger red + pulse animation.
- Role badges: `admin` danger, `lider` warning, `piloto` info.

### Modals

- Overlay: `rgba(0, 0, 0, 0.65)` blur backdrop.
- Card: `var(--mc-bg-card)`, `var(--mc-radius-xl)`, `var(--mc-shadow-lg)`.
- Header: title + close icon.
- Footer: right-aligned buttons with secondary + primary.
- Danger modal: left accent bar in danger color.

### Toast Notifications

- Slide in from right.
- Success: green accent.
- Error: danger red with subtle pulse.
- Warning: amber.
- Info: blue.
- Rounded, dark card background.

### Empty States

- Centered inside a card or page.
- Large muted icon (48px).
- Short title + helper text + optional action button.
- Use `var(--mc-text-muted)` for the icon and text.

### Loading / Skeletons

- Shimmer from `var(--mc-bg-card)` to `var(--mc-ink-600)` back.
- Use for cards, table rows, KPIs.

---

## 8. Page-Specific Requirements

### Login / Auth Pages

- Full-screen dark background with a subtle radial gradient from the center (amber glow at 10% opacity).
- Auth card: glass-like card with `var(--mc-bg-card)`, border, shadow.
- Logo centered, large.
- Inputs full-width, primary button full-width.
- Link text: `var(--mc-accent)`.

### Dashboard

- Page header: greeting + club name + primary action button.
- KPI grid: 4 cards on desktop, 2 on tablet, 1 on mobile.
- Below: two-column layout. Left: upcoming events / rodadas list. Right: active SOS alerts card (danger accent).
- Event list items should show status badge, date, title, route difficulty, and attendee count.
- SOS alert item should be high-contrast with red icon, pulse animation, and a clear action button.

### Events / Rodadas List

- Toolbar: search input + filter select + primary "Create Event" button.
- Table with columns: title, date, difficulty, route, status, attendees, actions.
- Difficulty shown as colored badges (easy = success, medium = warning, hard = danger, expert = danger stronger, trip = info).
- Actions: edit / view / delete icon buttons.

### Routes / Rutas List

- Similar toolbar.
- Cards instead of table? Use a responsive grid of route cards with mini map thumbnail placeholder, distance, time, difficulty.

### Members List

- Table with avatar circle, name, role badge, rider level, email, join date, actions.
- Avatar: circle with initials if no avatar_url.

### Reports Page

- Date range filter + club selector.
- Summary cards for events, SOS, members.
- Chart area placeholder for future charts (keep dark theme).
- Use tab-like navigation for event / SOS / member reports.

### Settings Page

- Tabs or card sections: general, billing, plan.
- Form card with two-column grid on desktop.
- Save button bottom-right.
- Section headers with subtle uppercase labels.

### Billing Page

- Plan card: large plan name, status badge, trial end date, upgrade button.
- Payment history table (or empty state).
- Usage stat bars: members, events, routes, SOS.

---

## 9. Icons

Use Ionicons (`ionicons` package). Prefer:
- Dashboard: `speedometer-outline`
- Events/Rodadas: `calendar-outline` or `flag-outline`
- Routes: `map-outline` or `navigate-outline`
- Members: `people-outline`
- SOS: `warning-outline` or `alert-circle-outline` (danger)
- Reports: `bar-chart-outline`
- Billing: `card-outline`
- Settings: `settings-outline`
- Clubs: `business-outline`
- Logout: `log-out-outline`
- Search: `search-outline`
- Plus: `add-outline`
- Edit: `create-outline`
- Delete: `trash-outline`
- Chevron: `chevron-down-outline`

---

## 10. Animations & Micro-interactions

- Transitions: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- Sidebar nav item: 0.15s background + border color.
- Cards: `transform 0.2s ease, box-shadow 0.2s ease`.
- Button hover: slight lift or glow.
- Page load: fade in content with 0.2s ease.
- SOS pulse: keyframes pulse using opacity and shadow.
- Toast slide: translateX from 120% to 0%.
- Modal scale: scale 0.95 → 1, opacity 0 → 1.
- Skeleton shimmer: background gradient animation.

---

## 11. Responsive Behavior

- Desktop: full sidebar + topbar + content grid.
- Tablet (<1024px): sidebar collapses to icons only, tooltips on hover (optional), content grid reduces columns.
- Mobile (<768px): sidebar hidden behind hamburger menu in topbar. Content single column. KPI grid 1 column.
- All tables should be horizontally scrollable.
- Forms should be single column on mobile.

---

## 12. Accessibility

- Minimum contrast ratio 4.5:1 for text.
- Focus rings on all interactive elements using `var(--mc-accent-glow)`.
- Do not rely solely on color for status; use icons with badges.
- Buttons and inputs should have clear disabled states.

---

## 13. Implementation Order

1. Replace `:root` in `src/style.css` with the complete design token system above.
2. Update layout components: `AppLayout.ts`, `Sidebar.ts`, `TopBar.ts`.
3. Update shared components: `ConfirmModal.ts`, `Skeleton.ts`, `Toast.ts`.
4. Update auth page: `src/pages/auth/*.ts`.
5. Update dashboard page.
6. Update list pages: events, routes, members, support points.
7. Update settings, billing, reports, clubs.
8. Verify `bun run build` passes after each major section.
9. Verify responsive behavior at 1440px, 1024px, 768px, 375px.

---

## 14. Output Expectations

- The final CSS must be one cohesive file or a small set of files, no inline styles in components unless absolutely necessary.
- All existing pages should be visually consistent with the new design system.
- No new runtime dependencies unless the user explicitly approves.
- The app should feel like a premium dark-mode admin dashboard made for motorcycle clubs.
