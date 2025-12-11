
export interface CaseStudy {
  name: string;
  type: 'WINNER' | 'LOSER';
  background: string;
  strategy: string;
  outcome: string;
  revenue: string;
}

export interface AffiliateOpp {
  program: string;
  potential: string;
  type: 'PARTICIPANT' | 'WRITER'; // 'PARTICIPANT' = for doing the hustle, 'WRITER' = for writing about it
  commission: string;
  notes: string;
}

export interface Stat {
  label: string;
  value: string;
  context: string;
}

export interface ResearchData {
  marketStats: Stat[];
  caseStudies: CaseStudy[];
  affiliates: AffiliateOpp[];
  hiddenCosts: Stat[];
  ethicalRating: number; // 1-10
  profitPotential: string;
  summary: string;
}

export interface VisualElement {
  type: 'HERO' | 'CHART' | 'CALLOUT' | 'PORTRAIT' | 'DIAGRAM';
  description: string;
  caption?: string;
  imageUrl?: string; // Generated image URL
}

export interface Cover {
  titleText?: string;
  subtitleText?: string;
  blurb?: string;
  visualDescription: string;
  imageUrl?: string;
}

export interface Chapter {
  number: number;
  title: string;
  content: string; // Markdown content
  posiBotQuotes?: {
    position: 'LEFT' | 'RIGHT';
    text: string;
  }[];
  visuals?: VisualElement[];
}

export interface Book {
  title: string;
  subtitle: string;
  frontCover?: Cover;
  backCover?: Cover;
  chapters: Chapter[];
}

export interface GenSettings {
  tone: string;
  visualStyle: string;
  lengthLevel: number; // 1 (Nano), 2 (Standard), 3 (Deep)
  imageDensity: number; // 1 (Text), 2 (Balanced), 3 (Visual Heavy)
  techLevel: number; // 1 (Artistic), 2 (Hybrid), 3 (Technical)
  targetWordCount?: number;
  caseStudyCount?: number;
  frontCoverPrompt?: string;
  backCoverPrompt?: string;
}

export interface GeneratedContent {
  book: Book;
  research: ResearchData;
  settings: GenSettings;
}

export type AppState = 'INPUT' | 'GENERATING' | 'RESULT';
