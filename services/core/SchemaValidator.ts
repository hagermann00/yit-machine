import { z } from "zod";

// --- EXISTING RESEARCH SCHEMAS ---

export const StatSchema = z.object({
  label: z.string(),
  value: z.string(),
  context: z.string(),
});

export const CaseStudySchema = z.object({
  name: z.string(),
  type: z.enum(['WINNER', 'LOSER']),
  background: z.string(),
  strategy: z.string(),
  outcome: z.string(),
  revenue: z.string(),
});

export const AffiliateOppSchema = z.object({
  program: z.string(),
  potential: z.string(),
  type: z.enum(['PARTICIPANT', 'WRITER']),
  commission: z.string(),
  notes: z.string(),
});

export const ResearchDataSchema = z.object({
  summary: z.string(),
  ethicalRating: z.number().min(1).max(10),
  profitPotential: z.string(),
  marketStats: z.array(StatSchema),
  hiddenCosts: z.array(StatSchema),
  caseStudies: z.array(CaseStudySchema),
  affiliates: z.array(AffiliateOppSchema),
});

export type ValidatedResearchData = z.infer<typeof ResearchDataSchema>;

// --- NEW BOOK SCHEMA (For Author Agent) ---

const VisualSchema = z.object({
  type: z.enum(['HERO', 'CHART', 'CALLOUT', 'PORTRAIT', 'DIAGRAM']),
  description: z.string(),
  caption: z.string().optional(),
});

const PosiBotQuoteSchema = z.object({
  position: z.enum(['LEFT', 'RIGHT']),
  text: z.string(),
});

const ChapterSchema = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
  posiBotQuotes: z.array(PosiBotQuoteSchema).optional().default([]),
  visuals: z.array(VisualSchema).optional().default([]),
});

const CoverSchema = z.object({
  titleText: z.string().optional(),
  subtitleText: z.string().optional(),
  visualDescription: z.string(),
});

const BackCoverSchema = z.object({
  blurb: z.string(),
  visualDescription: z.string().optional(),
});

export const BookSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  frontCover: CoverSchema,
  backCover: BackCoverSchema,
  chapters: z.array(ChapterSchema),
});

export type ValidatedBook = z.infer<typeof BookSchema>;
