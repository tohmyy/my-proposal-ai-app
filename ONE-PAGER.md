# **KOYA TALENT — AI PROPOSAL APPLICATION**

**Owner:** Oluwatofunmi  |  **Last Updated:** 11 September 2026  |  **Status:** Phase 5.7 of 6 (hardening/deploy next)

### **The Problem & Non-Negotiables**

After a discovery call, the sales team wrote every client proposal by hand from notes, old proposals, and memory. It was slow, and quality depended entirely on who wrote it. We built an app that turns structured intake into a client-ready draft with Claude — under four ground rules:

* **Human always signs off:** nothing reaches a client without an explicit approval step. Sales can request approval; only a signed-in **approver**-role account can approve, reject, or send — enforced in the server action itself, not just hidden in the UI.
* **Claude never invents commercial facts:** pricing, timelines, and scope must come from the intake or supporting material. If a hard field (needs summary, scope, timeline, or price) is missing, the system returns **needs_clarification** with specific gaps instead of guessing.
* **Every AI call is a validated contract, not free text:** generation, section regeneration, and intake extraction are all forced through a structured tool call and checked against a schema before anything touches the database — a bad response fails loudly, never writes partial garbage.
* **Every action is logged for evidence:** generated, clarification-needed, regenerated, approval-requested, approved, rejected, sent, and failed all append to a visible, timestamped activity log on the proposal itself.

### **How It Works**

1. **Intake:** a salesperson starts a draft by filling ~16 structured fields by hand, pasting a raw call summary, or uploading a PDF/text document — Claude pre-fills whatever it can find (never guessing the rest), and the human reviews before saving.
2. **Generate:** Claude receives the structured intake plus optional supporting material and returns exactly six proposal sections via a forced tool call, or flags `needs_clarification` with the specific missing facts if a hard field is empty.
3. **Review & Revise:** the salesperson edits any section in a rich-text editor, or regenerates one section — or every section an intake edit actually affects — without disturbing the rest. Every AI write and human edit is kept in an append-only revision history, restorable at any time.
4. **Approve:** sales requests approval once ready; only an **approver** can approve or send it back for changes, with a reason visible on the hub.
5. **Deliver & Log:** on approval, the proposal renders to a real PDF (server-side headless Chromium) and can be emailed to the client via Resend with the PDF attached — the client-facing preview link works without an account, but shows only the static document, never edit/approval controls.

### **How to Use It**

**First-Time Setup (Once):**

* Clone the repo, copy `.env.example` → `.env`, and set: `DATABASE_URL`/Supabase keys, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`, and `APPROVER_EMAILS` (comma-separated allowlist — anyone signing up with one of these emails becomes an approver, everyone else becomes sales).
* Run `npm run db:push` to create the schema, then `npm run dev`.
* Sign up at `/sign-up` — no admin step needed, roles are assigned automatically at signup.

**Day-to-Day Operations:**

* **Create:** `/proposals/new` → fill manually, paste a call summary, or upload a document → **Create draft**.
* **Generate & refine:** hit **Generate with AI** from the hub, review the draft, edit or regenerate sections as needed.
* **Approve & send:** **Request approval** → an approver reviews on the preview page and **Approves** or **Sends back for changes** → once approved, **Send to client** (previews the exact email before it goes out) or **Download PDF** from the hub.
* **Audit:** the hub's Activity panel shows every event on a proposal, in order, with who did what.

### **Key Gaps & Next Up**

* **Role checks are scoped to the approval trio only:** the other ~20 Server Actions (create/generate/save/settings) rely on the sign-in gate alone, not a per-action role check. **Next:** widen explicit checks if the user base grows past trusted internal staff.
* **No password reset, email verification, or admin role UI:** roles are fixed at signup via the env allowlist. **Next:** add an admin screen if roles need to change after the fact.
* **Document upload supports PDF and plain text only** (no `.docx`, by deliberate scope choice). **Next:** add a docx-to-text step if Word-exported call notes become common.
* **Phase 6 (hardening, evidence, deploy) not started:** no production deployment yet, and the serverless PDF-rendering path is verified only locally. **Next:** deploy to Vercel, confirm serverless Chromium end-to-end, and complete the PRD testing-evidence table.
