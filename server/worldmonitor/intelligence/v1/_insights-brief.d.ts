import type { Cluster } from './_clustering';

export const BRIEF_REJECTIONS: Readonly<{
  NO_TOP_STORIES: 'no-top-stories';
  MISSING_CLUSTER: 'missing-brief-cluster';
  PARSE: 'parse-failed';
  LEAD_EMPTY: 'lead-no-sentences';
  LEAD_UNCITED: 'lead-uncited';
  LEAD_PROPER_NOUN: 'lead-proper-noun';
  LEAD_NUMERIC_FACT: 'lead-numeric-fact';
  LEAD_GROUNDING: 'lead-grounding';
}>;

export function pickBriefCluster(topStories: Cluster[]): Cluster | null;
export function briefSystemPrompt(dateISO: string): string;
export function briefUserPrompt(headline: string): string;
export function synthesisSystemPrompt(dateISO: string): string;
export function synthesisUserPrompt(stories: Cluster[]): string;

export interface ParsedBriefSynthesis {
  lead: string;
  lines: Array<{ n: number; text: string }>;
}

export function parseBriefSynthesis(rawText: string, storyCount: number): ParsedBriefSynthesis | null;

export function maskAttributedSources(text: string, sources: unknown[]): string;

export interface ComposedBriefSource {
  title: string;
  source: string;
  url: string;
}

export interface ComposedBrief {
  lead: string;
  lines: Array<{ n: number; text: string }>;
  sources: ComposedBriefSource[];
  hallucinatedLines: number;
  strippedCitations: number;
  sourceAttributions: number;
}

export interface ComposeBriefOptions {
  validatorMode?: 'enforce' | 'shadow';
  sanitizeTitle?: (title: string) => string;
  sourceFromStory?: (story: Cluster) => ComposedBriefSource | null;
  briefCluster?: Cluster | null;
  parsedSynthesis?: ParsedBriefSynthesis | null;
}

export function composeSynthesizedBrief(
  rawText: string,
  topStories: Cluster[],
  opts?: ComposeBriefOptions,
): ComposedBrief | null;

export function composeSynthesizedBriefResult(
  rawText: string,
  topStories: Cluster[],
  opts?: ComposeBriefOptions,
): { brief: ComposedBrief | null; rejection: string | null; rejectionDetail: string | null };
