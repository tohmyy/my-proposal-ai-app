# Proposal Intake Fields

Adapted from the original reference form for structured generation. Original: https://forms.gle/5GXAVU92sqJf3EAKA

## Fields

| Field | Suggested Key | Type | Notes |
| --- | --- | --- | --- |
| Client Name | `client_name` | text | Name of the client contact. |
| Client Email | `client_email` | text | Email address for client delivery. |
| Company Name | `company_name` | text | Client company or organization. |
| Date of Call | `date_of_call` | date | Date the sales or discovery call happened. |
| Salesperson Name | `salesperson_name` | text | Person preparing or owning the proposal. |
| Summary of Client's Needs | `client_needs_summary` | text | The problem the client wants to solve. **Hard** |
| Project Scope | `project_scope` | text | What the client wants built or delivered. **Hard** |
| Goals and Objectives | `goals` | `string[]` | Outcome bullets (e.g. revenue growth, efficiency). Soft |
| Recommended Services or Deliverables | `recommended_services` | `string[]` | Service / deliverable bullets. Soft |
| Proposed Timeline (summary) | `proposed_timeline` | text | Free-text duration or window. **Hard** if no usable phases |
| Timeline Phases | `timeline_phases` | object[] | Optional: `{ phase, label?, duration?, delivery_window? }`. Counts toward hard timeline if a phase has duration or delivery window |
| Currency | `currency` | text | ISO code (e.g. `USD`, `EUR`, `GBP`, `CAD`, `AUD`). Defaults to `USD`. Applies to `proposed_price`/`price_range` |
| Proposed Price | `proposed_price` | text | Concrete price. **Hard** if `price_range` empty |
| Price Range | `price_range` | text | Range when no single figure. **Hard** if `proposed_price` empty |
| Pricing Notes | `pricing_notes` | text | Terms, exclusions, assumptions. Soft alone — not enough for commercial completeness |
| Supporting Material | `supporting_material` | text | Pasted notes / excerpts. Optional |
| Proposal style | `template_id` | enum | `koya_classic` (default), `koya_collage`, `koya_navy`. Presentation skin only — locked after first generate. Legacy `koya_v1` → classic. |

### Timeline phase shape

```json
[
  {
    "phase": 1,
    "label": "Discovery",
    "duration": "4 days",
    "delivery_window": "1 week"
  }
]
```

App JSON uses camelCase `deliveryWindow`; SQL/docs may show `delivery_window`.
