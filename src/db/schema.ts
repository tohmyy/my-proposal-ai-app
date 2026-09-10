import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const proposalStatuses = [
  "draft",
  "generating",
  "needs_clarification",
  "in_review",
  "pending_approval",
  "approved",
  "sent",
  "failed",
] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export type TimelinePhase = {
  phase: number;
  label?: string;
  duration?: string;
  deliveryWindow?: string;
};

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").$type<ProposalStatus>().notNull().default("draft"),
  title: text("title"),
  clientName: text("client_name").notNull().default(""),
  clientEmail: text("client_email").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  dateOfCall: date("date_of_call"),
  salespersonName: text("salesperson_name").notNull().default(""),
  clientNeedsSummary: text("client_needs_summary").notNull().default(""),
  projectScope: text("project_scope").notNull().default(""),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  recommendedServices: jsonb("recommended_services")
    .$type<string[]>()
    .notNull()
    .default([]),
  proposedTimeline: text("proposed_timeline").notNull().default(""),
  timelinePhases: jsonb("timeline_phases")
    .$type<TimelinePhase[]>()
    .notNull()
    .default([]),
  currency: text("currency").notNull().default("USD"),
  proposedPrice: text("proposed_price").notNull().default(""),
  priceRange: text("price_range").notNull().default(""),
  pricingNotes: text("pricing_notes").notNull().default(""),
  supportingMaterial: text("supporting_material").notNull().default(""),
  lastGeneratedIntakeSnapshot: jsonb("last_generated_intake_snapshot").$type<
    Record<string, unknown>
  >(),
  templateId: text("template_id").notNull().default("koya_v1"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const proposalSections = pgTable(
  "proposal_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    htmlContent: text("html_content").notNull().default(""),
    humanEdited: boolean("human_edited").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("proposal_sections_proposal_id_key_idx").on(
      table.proposalId,
      table.key,
    ),
  ],
);

export const proposalEvents = pgTable("proposal_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type ProposalSection = typeof proposalSections.$inferSelect;
export type ProposalEvent = typeof proposalEvents.$inferSelect;
