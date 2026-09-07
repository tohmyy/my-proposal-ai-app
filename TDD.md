# Technical Design Document: AI Proposal Application

**Status:** Draft — some decisions still `[OPEN]` (see §11)  
**Related:** [PRD.md](./PRD.md), [assets/](./assets/)  
**Last updated:** 2026-09-07

---

## 1. Purpose

This document defines the technical architecture for a small web application that:

1. Collects proposal intake (client, scope, pricing, etc.)
2. Generates a structured proposal via the Claude API
3. Lets a salesperson manually edit and/or AI-regenerate individual sections
4. Produces a client-ready document (PDF)
5. Requires internal approval before client delivery
6. Sends or exports the approved proposal and logs the record

It is the implementation blueprint for [PRD.md](./PRD.md).

---

## 2. Goals and non-goals

### Goals

- Ship a working, publicly reachable demo that covers all PRD test scenarios
- Keep a human in control: edit before send; no client delivery without approval
- Prefer clarity and debuggability over enterprise workflow complexity
- Store proposal content in a form that supports both rich editing and faithful PDF export

### Non-goals (MVP)

- Multi-tenant SaaS / org billing
- RAG over a large historical proposal corpus
- Full DOCX authoring parity with Microsoft Word
- Complex role hierarchies, SSO, or audit-grade compliance
- Real-time collaborative editing

---

## 3. Product flow

```text
Intake → Generate (Claude) → Review / Edit / Regen → Request approval
    → Approve → Export PDF → Deliver (email and/or download) → Log
```

**Hard gate:** status must be `approved` (or equivalent) before send/delivery APIs succeed.

### Status machine

```text
draft
  → generating
  → needs_clarification   (missing critical intake; AI/app flags gaps)
  → in_review             (content ready for salesperson edit)
  → pending_approval
  → approved
  → sent
  → failed                (terminal or recoverable; see events)
```

Allowed transitions (MVP):

| From | To | Trigger |
| --- | --- | --- |
| `draft` | `generating` | User submits intake / clicks Generate |
| `generating` | `in_review` | Claude returns usable sections |
| `generating` | `needs_clarification` | Gaps detected; no unsupported fill-in |
| `needs_clarification` | `generating` | User supplies missing fields and regenerates |
| `in_review` | `in_review` | Manual save or section regen |
| `in_review` | `pending_approval` | User requests approval |
| `pending_approval` | `approved` | Anyone clicks Approve (no separate role) |
| `pending_approval` | `in_review` | Anyone rejects / requests changes |
| `approved` | `sent` | Email/export delivery succeeds |
| `*` | `failed` | Optional coarse flag; prefer event log + keep prior status |

---

## 4. Architecture overview

```text
┌─────────────────────────────────────────────────────────┐
│  Next.js (App Router) + TypeScript                      │
│  UI (Tailwind + shadcn)  │  Route Handlers / Server Actions │
└───────────────┬───────────────────────┬─────────────────┘
                │                       │
                ▼                       ▼
         Anthropic Claude         Postgres (Supabase)
         (generation / regen)     proposals, sections, events
                │
                ▼
         HTML compose + CSS template
                │
        ┌───────┴────────┐
        ▼                ▼
   TipTap editor    PDF renderer
   (browser)        (Playwright or print pipeline)
        │                │
        └───────┬────────┘
                ▼
         Resend (email + PDF attachment)
                +
         Supabase Storage (generated PDFs)
```

### Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| App | Next.js App Router + TypeScript | UI + API in one deployable unit |
| UI | Tailwind CSS + shadcn/ui | Forms, status, editor chrome |
| Rich editor | TipTap | Edits section HTML; users never see raw HTML |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) | Required by PRD |
| DB | Postgres via **Supabase** | Proposals, sections, events |
| ORM | Prisma or Drizzle `[OPEN]` | Prefer whichever the implementer knows |
| Auth | **None for MVP** | Wire **Supabase Auth** later via `.env` when ready (see §9) |
| Approval | **Anyone** | No salesperson vs approver split; Approve is an open action |
| Documents | HTML + shared CSS → PDF | Prefer pixel consistency editor ↔ PDF |
| Email | Resend | Client delivery; **prefer PDF attachment** (also support link + download) |
| Files | **Supabase Storage** | Generated PDFs (see §4.1 — not ImageKit) |
| Hosting | Vercel | Public application link for submission |

### 4.1 File storage decision

**Use Supabase Storage** for proposal PDFs (and any later uploads).

| Option | Fit for this app |
| --- | --- |
| **Supabase Storage** | Best default: already on Supabase, free tier, PDFs/private buckets, signed URLs for email links |
| **ImageKit** | Strong for **image CDN/transform**; awkward as primary store for proposal **PDFs**. Extra vendor + keys for little gain on this MVP |
| Vercel Blob | Fine alternative if we want zero Supabase storage setup; redundant if Supabase is already chosen |

**Recommendation:** skip ImageKit for MVP. Revisit only if we add logo/image-heavy branding that needs on-the-fly transforms.

---

## 5. Content model: structured sections + HTML

### Design choice

Do **not** store only one opaque HTML blob as the sole source of truth.

Store:

1. **Structured sections** (stable keys, order, titles)
2. **`html_content` per section** (sanitized, allowlisted HTML)
3. **Branding / layout CSS separately** (template, not mixed into content)

```text
             Claude
               ↓
     Structured section payloads
     (text / constrained HTML)
               ↓
     App renders & sanitizes → section.html_content
               ↓
     ┌─────────┴─────────┐
     ▼                   ▼
 TipTap (edit)      Compose full HTML + template CSS
     │                   │
     ▼                   ▼
 Save section       PDF / print preview
```

### Why

- Section regeneration without rewriting the whole proposal
- Manual edit of any section (and thus the whole document)
- Safer AI output handling
- Shared CSS for screen preview and PDF

### Section keys (aligned to [assets/proposal-template.md](./assets/proposal-template.md))

| Key | Title |
| --- | --- |
| `introduction` | Introduction |
| `proposed_solution` | Proposed Solution |
| `deliverables` | Deliverables |
| `timeline` | Timeline |
| `pricing` | Pricing |
| `next_steps` | Next Steps |

Header metadata (client name, salesperson, date, company) lives on the proposal row, not inside section HTML, and is injected by the template when composing the document.

### HTML allowlist (MVP)

Allowed tags (illustrative): `h1–h3`, `p`, `ul`, `ol`, `li`, `strong`, `em`, `a` (http/https only), `br`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `blockquote`.

Disallowed: `script`, `iframe`, `object`, event handlers, `javascript:` URLs, inline styles beyond a tiny allowlist (prefer classes from template CSS).

**Sanitize on write** (after AI and after TipTap save).

### AI generation contract

Prefer:

**Claude → JSON sections (prose or lightly marked content) → app → sanitized HTML**

Avoid unconstrained free-form HTML from the model. If the model returns HTML, still run it through the same sanitizer and schema validation.

Example generation response shape:

```json
{
  "status": "ok" | "needs_clarification",
  "gaps": [{ "field": "pricing", "message": "..." }],
  "clarifying_questions": ["..."],
  "sections": [
    {
      "key": "introduction",
      "title": "Introduction",
      "content": "Thank you for taking the time..."
    }
  ]
}
```

`needs_clarification`: do not invent missing commercial facts (pricing, timeline, scope). Mark gaps; keep proposal in `needs_clarification` until the user updates intake and regenerates (or explicitly accepts partial generation — `[OPEN]`).

---

## 6. Data model

### `proposals`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `status` | enum/text | See status machine |
| `title` | text | Optional display title |
| `client_name` | text | Intake |
| `client_email` | text | Intake / delivery |
| `company_name` | text | Intake |
| `date_of_call` | date | Intake |
| `salesperson_name` | text | Intake |
| `client_needs_summary` | text | Intake |
| `project_scope` | text | Intake |
| `goals` | jsonb (`string[]`) | Outcome bullets |
| `recommended_services` | jsonb (`string[]`) | Service / deliverable bullets |
| `proposed_timeline` | text | Free-text timeline summary |
| `timeline_phases` | jsonb | Optional `[{ phase, label?, duration?, deliveryWindow? }]` |
| `proposed_price` | text | Concrete price |
| `price_range` | text | Range when no single figure |
| `pricing_notes` | text | Terms / exclusions (soft alone) |
| `supporting_material` | text | Pasted notes / excerpts `[OPEN: file upload]` |
| `template_id` | text | Default `koya_v1` |
| `pdf_url` | text nullable | Last generated PDF |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `proposal_sections`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `proposal_id` | uuid | FK |
| `key` | text | e.g. `introduction` |
| `title` | text | Display heading |
| `position` | int | Order |
| `html_content` | text | Sanitized HTML |
| `updated_at` | timestamptz | |

Unique `(proposal_id, key)`.

### `proposal_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `proposal_id` | uuid | FK |
| `type` | text | `generated`, `section_saved`, `section_regenerated`, `clarification_needed`, `approval_requested`, `approved`, `rejected`, `pdf_generated`, `email_sent`, `failed` |
| `message` | text | Human-readable; enough to debug |
| `meta` | jsonb nullable | Error codes, section key, provider ids |
| `created_at` | timestamptz | |

Logging for PRD scenario 6–7 is primarily this table plus visible UI errors.

---

## 7. Application surfaces (UI)

| Route / view | Purpose |
| --- | --- |
| `/` | List proposals + create new |
| `/proposals/new` | Intake form (fields from [assets/intake-form-fields.md](./assets/intake-form-fields.md)) + supporting material |
| `/proposals/[id]` | Hub: status, actions (generate, request approval, send, download) |
| `/proposals/[id]/edit` | Section list + TipTap editor; per-section **Save** and **Regenerate with AI** |
| `/proposals/[id]/preview` | Composed HTML with template CSS (print-friendly) |
| `/proposals/[id]/approve` | Approval view — same open access as rest of app (anyone may approve/reject) |

UI requirements tied to tests:

- Show gaps / clarifying questions clearly when status is `needs_clarification`
- Disable **Send to client** unless `approved`
- Surface failures inline with the failed step (PDF, email, approve, log)

---

## 8. Backend / API capabilities

Implement as Next.js Route Handlers or Server Actions. Conceptual endpoints:

| Capability | Behavior |
| --- | --- |
| Create / update intake | Persist draft; validate required fields soft vs hard `[OPEN]` |
| Generate proposal | Call Claude with intake + template guidance + supporting material; write sections; append event |
| Save section | Sanitize HTML; update section; event `section_saved` |
| Regenerate section | Claude with full proposal context + target section only; replace that section’s HTML; event `section_regenerated` |
| Request approval | `in_review` → `pending_approval` |
| Approve / reject | Gate; events; reject returns to `in_review` |
| Generate PDF | Compose HTML + CSS; render PDF; store; set `pdf_url`; event |
| Send to client | **Reject if not approved**; email via Resend using [assets/client-email-template.md](./assets/client-email-template.md); **attach PDF** (primary); optionally include preview link; also allow download from hub; event `email_sent` or `failed` |
| List events | For debugging / evidence |

### Claude usage

- Model: configurable via env (e.g. Claude Sonnet class) `[OPEN: exact model id]`
- Prompts: system instructions for Koya-style proposals, no invented pricing/timeline/scope, use supporting material when relevant
- Section regen prompt: include intake + all current section texts + instruction to rewrite only `key`

### PDF

- Compose a single HTML document from header metadata + ordered sections
- Apply `templates/koya_v1.css` (print `@page`, page breaks)
- Render with Playwright/Chromium **or** a hosted browserless printer `[OPEN: local Playwright on Vercel vs external]`
- Fallback for demo risk: high-quality **Print to PDF** from preview page if server PDF is blocked — document as known limitation if used

### Email

- Resend API
- Body adapted from client email template
- **Primary:** PDF attachment (from Supabase Storage / generated buffer)
- **Also:** proposal/preview link in body when useful; hub **Download PDF** for manual export

### Env vars (planned)

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude |
| `RESEND_API_KEY` | Email |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser / client Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB/storage |
| Supabase Auth vars | Added later when auth is enabled — app coded so auth can be switched on without redesign |

---

## 9. Security and safety

- API keys only on server (`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Sanitize all HTML on write
- Never send to client without `approved`
- Rate-limit generate/regen in demo if easy (optional)
- **Auth MVP:** none — public demo URL is writable; acceptable for class/demo risk profile
- **Auth later:** Supabase Auth via `.env`; keep data access behind server routes so adding session checks is localized
- Supabase Storage: private bucket for PDFs; serve via signed URLs or server-proxied download/email attach

---

## 10. Failure handling

Every fallible step writes a `proposal_events` row with `type = failed` (or specific `*_failed`) and a clear `message`.

UI must show:

- Which step failed
- Why (provider message / validation)
- Whether the proposal content is still intact (regen/PDF/email failures must not wipe sections)

---

## 11. Decisions

### Locked

| Topic | Decision |
| --- | --- |
| Auth (MVP) | No auth; prepare for Supabase Auth via env later |
| Who can approve | Anyone (no separate role) |
| Client delivery | Email primary; prefer **PDF attachment**; also link + in-app download |
| Database | Supabase (Postgres) |
| File storage | **Supabase Storage** (not ImageKit for MVP) |

### Still open

1. **Supporting material** — textarea paste only vs file upload vs both.  
2. **Partial generation when gaps exist** — block until required fields filled vs draft with `[GAP]` markers.  
3. **PDF rendering on Vercel** — Playwright/serverless vs external render vs client print fallback.  
4. **ORM** — Prisma vs Drizzle.  
5. **DOCX export** — out of MVP vs stretch.  
6. **Exact Claude model** — model id for cost/quality.

---

## 12. Testing plan (maps to PRD)

| # | Scenario | How we verify |
| --- | --- | --- |
| 1 | Normal generation | Complete intake → sections populated → preview readable |
| 2 | Missing information | Omit pricing/scope → `needs_clarification` or explicit gaps; no fabricated numbers |
| 3 | Supporting material | Paste distinctive phrase → appears appropriately in a section |
| 4 | Section regeneration | Regen `deliverables` only → other sections unchanged |
| 5 | Human approval | Attempt send while `in_review` → rejected; after approve → allowed |
| 6 | Delivery and logging | PDF/email succeeds; `proposal_events` shows generated/approved/sent |
| 7 | Failure handling | Force bad email/PDF config → UI error + failed event; content preserved |

Evidence: screenshots + event log excerpts for the submission table.

---

## 13. Deliverables alignment

| PRD deliverable | System support |
| --- | --- |
| Application link | Vercel deployment |
| Generated proposal sample | Export PDF from a seeded happy-path proposal |
| Testing evidence | Walk §12; attach UI + event proof |
| Video walkthrough | Loom of full path |
| One-page documentation | Short ops/architecture page derived from this TDD |
| Reflection sheet | Out of band |

---

## 14. Implementation sequence (suggested)

1. Scaffold Next.js + DB schema + proposal CRUD + intake form  
2. Claude generate → sections → edit page with TipTap + sanitize  
3. Section regenerate  
4. Status machine + approval gate  
5. Preview CSS + PDF export  
6. Resend delivery + events  
7. Failure paths + polish + deploy  

---

## 15. References

- [PRD.md](./PRD.md)
- [assets/intake-form-fields.md](./assets/intake-form-fields.md)
- [assets/proposal-template.md](./assets/proposal-template.md)
- [assets/client-email-template.md](./assets/client-email-template.md)
