# Design system — Koya Ink

Visual source of truth for the app chrome. Proposal **preview/PDF** skins live in [`src/app/globals.css`](./src/app/globals.css) under `.template-koya-*` (see [BUILD-PLAN-templates.md](./BUILD-PLAN-templates.md)).

Tokens live in [`src/app/globals.css`](./src/app/globals.css). Fonts load in [`src/app/layout.tsx`](./src/app/layout.tsx).

## Brand

- Product: **Koya Talent**
- App context: proposals / sales intake
- Wordmark is a **hero-level** signal in the shell (Syne, bold) — not a tiny nav afterthought

## Color

| Token | Value | Use |
| --- | --- | --- |
| `--koya-mist` | `#F4F6F8` | Page background |
| `--koya-ink` | `#0C1222` | Primary text |
| `--koya-ink-soft` | `#243044` | Secondary text / hover |
| `--koya-muted` | `#6B7585` | Hints, metadata |
| `--koya-line` | `#D5DDE6` | Borders, dividers |
| `--koya-accent` | `#0F766E` | Primary CTA, links, emphasis |
| `--koya-accent-hover` | `#0D9488` | CTA hover |
| `--koya-surface` | `#FFFFFF` | Panels / form surfaces |

Atmosphere: cool mist base + subtle **grain** (`.koya-grain`) and soft teal/ink radial washes — not a flat white void.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display / brand | **Syne** (`--font-syne`) | App headings, wordmark; Collage template titles |
| UI / body | **Source Sans 3** (`--font-source-sans`) | Forms, chrome, nav; Navy/Collage body |
| Proposal content (Classic) | **Source Serif 4** (`--font-source-serif`) | Classic skin + section editor default (`.prose-koya`) |

Classic proposals read like a client letter (serif). Collage/Navy skins intentionally use sans for a more modern document feel. Keep Syne/Source Sans for shell chrome.

Avoid Inter, Roboto, Arial, or system-only stacks for branded surfaces.

## Proposal template skins

Selected on intake (`template_id`); locked after generate. Applied via `data-template` on `.proposal-document`.

| id | Feel |
| --- | --- |
| `koya_classic` | Warm white page, teal brand label, Source Serif titles/body (default) |
| `koya_collage` | Gray side rail + blue accent bar; uppercase Syne section titles |
| `koya_navy` | Full-width navy header band; white body; sans titles with navy markers |

Print/export reuses the same classes; Collage hides the wide gray rail to save ink and keeps a thin blue rule.

## Layout & UI patterns

- One focused composition per view (list → intake → hub → edit) — not a dense multi-widget dashboard
- Prefer borders + mist/white surfaces over heavy card stacks and multi-layer shadows
- Status chips: muted filled pills via `StatusBadge` tones — not neon glow
- Primary actions: teal filled buttons; secondary: outline / ink
- Motion (keep to 2–3 intentional patterns): `.animate-in-up`, `.animate-in-fade`, list row hover lift (`.proposal-row`)

## Do not

- Purple-on-white or purple→indigo gradient “AI SaaS” themes
- Warm cream + terracotta + default serif brochure look
- Dark-mode-first UI for MVP
- Glow effects, oversized rounded-full pill clusters, emoji decoration
- Inset hero media cards or floating promo badges on marketing-style pages

## Implementation tips

- Use CSS variables (`var(--koya-*)`) rather than one-off hex in new components
- New screens should reuse `AppShell`, `Button`, `Input`, `Textarea`, `Label`, `StatusBadge`
- Client proposal document skins may diverge from app teal for Collage/Navy accents while remaining print-friendly
