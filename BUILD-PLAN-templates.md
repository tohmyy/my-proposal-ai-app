# Build plan — Multi-template proposal skins

Presentation-only templates selected on intake. Same six AI sections and prompts for all skins.

## Catalog

| id | Label | Notes |
| --- | --- | --- |
| `koya_classic` | Classic | Current serif document (default). Legacy `koya_v1` aliases here. |
| `koya_collage` | Collage | Gray rail + blue accent; Syne/sans caps titles. |
| `koya_navy` | Navy | Deep navy header band; sans hierarchy. |

Registry: [`src/lib/proposals/templates.ts`](./src/lib/proposals/templates.ts).

## Behavior

1. Intake radio cards set `proposals.template_id` before generate.
2. After `proposal_sections` exist, template is **read-only** (UI + server ignore changes).
3. [`ProposalDocument`](./src/components/proposal-document.tsx) applies `data-template` + `template-*` class; CSS in [`globals.css`](./src/app/globals.css) (screen + print).

## Out of scope (v1)

- Changing template after generate / re-skin without regen
- Per-template prompts or section catalogs
- Vendor Indesign/Canva assets or stock photo packs
