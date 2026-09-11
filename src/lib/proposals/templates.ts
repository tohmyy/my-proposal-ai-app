export const TEMPLATE_IDS = [
  "koya_classic",
  "koya_collage",
  "koya_navy",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type ProposalTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  /** CSS class applied to ProposalDocument root */
  className: string;
  /** Swatch colors for the intake radio card */
  swatch: [string, string, string];
};

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "koya_classic",
    name: "Classic",
    description:
      "Warm serif document — the original Koya proposal look.",
    className: "template-koya-classic",
    swatch: ["#F4F6F8", "#0C1222", "#0F766E"],
  },
  {
    id: "koya_collage",
    name: "Collage",
    description:
      "Modern geometric layout with a gray rail and blue accent bar.",
    className: "template-koya-collage",
    swatch: ["#E8E8E8", "#111111", "#2F6FED"],
  },
  {
    id: "koya_navy",
    name: "Navy",
    description:
      "High-contrast navy header band and clean sans typography.",
    className: "template-koya-navy",
    swatch: ["#FFFFFF", "#0B1F3A", "#1E3A5F"],
  },
];

const TEMPLATE_BY_ID = Object.fromEntries(
  PROPOSAL_TEMPLATES.map((t) => [t.id, t]),
) as Record<TemplateId, ProposalTemplate>;

/** Map legacy DB values to the canonical catalog id. */
export function normalizeTemplateId(raw: string | null | undefined): TemplateId {
  if (!raw || raw === "koya_v1") return "koya_classic";
  if ((TEMPLATE_IDS as readonly string[]).includes(raw)) {
    return raw as TemplateId;
  }
  return "koya_classic";
}

export function getProposalTemplate(
  raw: string | null | undefined,
): ProposalTemplate {
  return TEMPLATE_BY_ID[normalizeTemplateId(raw)];
}

export function isTemplateId(value: string): value is TemplateId {
  return (TEMPLATE_IDS as readonly string[]).includes(value);
}
