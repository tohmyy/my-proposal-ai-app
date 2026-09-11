# **KOYA TALENT — AI OPERATIONS REPORTING SYSTEM**

**Owner:** Oluwatofunmi  |  **Last Updated:** 4 September 2026  |  **Anchor Date:** 30 June 2026

### **The Problem & Non-Negotiables**

Leadership reporting meant hand-stitching numbers from Google Sheets (Sales), Airtable (Delivery), and a People Ops API. It was slow, calculations drifted across teams, and messy rows broke formulas or quietly polluted numbers.

We automated it under four ground rules:

* **Anchored to 30 June 2026:** All relative periods (Last 30, Last 90, YTD) evaluate against our fixed demo date, never calendar "today."  
* **Zero AI arithmetic:** n8n calculates every KPI deterministically in code. Claude only writes context and commentary from the final numbers—it never touches raw rows.  
* **Never guess bad data:** Malformed dates (`2026-02-30`) or blanks turn into clean `null` values with logged errors. We never guess what someone meant.  
* **Isolated failures:** Messy rows (`LEAD-BAD-DATE`) route to audit tables without crashing the run. The dashboard only reads completed runs from Supabase—zero client-side recalculation.

  ### **How the Pipeline Works**

1. **Trigger & Initialize:** A run starts (via schedule or dashboard webhook). n8n locks the period window (capped at `2026-06-30`) and creates a record in `report_runs` marked `running`.  
2. **Pull & Validate in Parallel:** n8n ingests Sales, Delivery, and People Ops data at the same time. Bad fields turn to `null` and log to separate error tables, while clean records get stripped of metadata and upserted into Supabase entity tables.  
3. **Crunch KPIs in Engine Code:** Once data lands, a Code node in n8n filters records by the target period and runs the KPI math for all three departments.  
4. **Contextualize with Claude:** n8n hands the calculated metric totals and error counts to Claude, which writes the executive summary, risks, tactical actions, and data-quality notes.  
5. **Finalize & Serve:** The metrics and commentary save to Supabase, `report_runs` marks `completed`, and the read-only Next.js dashboard renders the pack instantly.

   ### **How to Use It**

**First-Time Setup (Once):**

* Import the workflow from `workflows/` into n8n and link credentials for Sheets, Airtable, Supabase, and Claude.  
* Confirm your Supabase tables exist: `report_runs`, `pipeline`, `projects`, `people`, `metrics`, `insights`, and the validation error tables.  
* Configure `dashboard/.env` with your Supabase URL/anon key plus the n8n webhook URL and secret.  
* Turn the n8n workflow active, then spin up the UI with `npm run dev` inside `dashboard/`.

**Day-to-Day Operations:**

* **Run a report:** Hit **Request Report** on the dashboard (or trigger manually in n8n) and wait for the completion email. If a run is already in progress, don't spam the button—just refresh.  
* **Review the pack:** Open Operations, pick a preset (Last 30 / 90 / YTD / Custom up to `2026-06-30`), or choose a past run from the dropdown. Leadership gets instant KPIs and Claude’s briefing.  
* **Audit data issues:** Check the Data Quality panel on the dashboard to spot-check bad rows, or jump directly into the `*_validation_errors` tables in Supabase for exact row-level details.

  ### **Key Gaps & Next Up**

* **Force Regenerate:** Currently, the UI grabs the existing run if someone asks for a period that already completed today. **Next:** Add a "Force Rebuild" trigger to pick up source changes made later in the day.  
* **Richer Error Context for Claude:** Claude currently sees high-level error counts, not specific error signatures. **Next:** Pass error categories so it can point out specific source bottlenecks.  
* 

