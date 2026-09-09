# Agent playbook — Koya Talent proposals

Read this before writing code. Specs win over improvisation.

## Read order

1. [PRD.md](./PRD.md) — product goals + test scenarios  
2. [TDD.md](./TDD.md) — architecture, status machine, data model, APIs  
3. [AI-SPEC.md](./AI-SPEC.md) — Claude prompts, JSON contracts, guardrails  
4. [PHASES.md](./PHASES.md) — what is done / what to build next  
5. [DESIGN.md](./DESIGN.md) — Koya Ink visual system  
6. [assets/](./assets/) — intake fields, proposal template, client email  

Do **not** invent alternate stacks, status values, section keys, or AI response shapes.

## Locked stack (MVP)

| Layer | Choice |
| --- | --- |
| App | Next.js App Router + TypeScript (`src/`) |
| UI | Tailwind v4 + local UI primitives (`src/components/ui`) |
| Editor | TipTap (Phase 2+) |
| AI | Anthropic Claude via `@anthropic-ai/sdk` — contracts in AI-SPEC only |
| DB | Postgres (Supabase) + Drizzle (`src/db`) |
| Auth | **None** for MVP (prepare for Supabase Auth later) |
| Files | Supabase Storage (Phase 5) |
| Email | Resend (Phase 5) |
| Hosting | Vercel |

## Working rules

- Implement **one phase at a time** per [PHASES.md](./PHASES.md). Do not skip ahead (e.g. no PDF before generate works).
- Keep **human in control**: never send to client without `approved` status (Phase 4+).
- AI must **not invent** pricing, timeline, or scope — follow AI-SPEC hard-field rules.
- Sanitize HTML on write after AI and TipTap (allowlist in TDD).
- API keys only on the server (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Match existing patterns in `src/lib/proposals`, `src/components`, and Koya Ink tokens in `src/app/globals.css`.
- Prefer small, focused diffs. Update PHASES.md status when a phase ships.

## Key paths

| Path | Purpose |
| --- | --- |
| `src/app/` | Routes (list, intake, hub, later edit/preview/approve) |
| `src/db/schema.ts` | Drizzle schema |
| `src/lib/proposals/` | Server actions + intake types |
| `src/lib/ai/` | Claude generate/regen (Phase 2+) |
| `src/components/` | App shell, intake editors, UI |
| `templates/` | Proposal CSS for preview/PDF (Phase 5) |
| `drizzle/` | SQL migrations |

## Env

Copy `.env.example` → `.env.local` (or `.env`). See README for required vars per phase.

## Design

Follow [DESIGN.md](./DESIGN.md). Do not introduce purple gradients, Inter/Roboto defaults, dark-mode-first chrome, or generic “AI SaaS” card grids that fight Koya Ink.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
