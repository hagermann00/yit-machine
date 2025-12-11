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
  summary: string;
  ethicalRating: number; // 1-10
  profitPotential: string;
  marketStats: Stat[];
  hiddenCosts: Stat[];
  caseStudies: CaseStudy[];
  affiliates: AffiliateOpp[];
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

export type ImageModelID = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image' | 'imagen-3.0-generate-001';

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
  customSpec?: string;
  imageModelHierarchy?: ImageModelID[];
}

export interface Branch {
  id: string;
  name: string;
  timestamp: number;
  settings: GenSettings;
  book: Book;
}

export interface Project {
  topic: string;
  research: ResearchData;
  branches: Branch[];
}

// For legacy/compatibility during migration if needed, though we primarily use Project now
export interface GeneratedContent {
  book: Book;
  research: ResearchData;
  settings: GenSettings;
}

export type AppState = 'INPUT' | 'RESEARCHING' | 'DRAFTING' | 'RESULT';

// Export Settings for PDF
export type TrimSize = '5x8' | '6x9' | '7x10';

export interface ExportSettings {
    trimSize: TrimSize;
    includeBleed: boolean;
    imageQuality: 'standard' | 'high';
}