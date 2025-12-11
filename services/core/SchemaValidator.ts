import { z } from "zod";

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
