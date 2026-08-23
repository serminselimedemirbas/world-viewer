// Type declarations for _clustering.mjs, so TypeScript callers outside
// scripts/ (server/worldmonitor/intelligence/v1/get-world-brief.ts) can
// import it. Mirrors the .d.mts convention already used by
// _simulation-queue-constants.mjs.

export interface ClusterThreat {
  level?: string;
  category?: string;
  confidence?: number;
  source?: string;
}

export interface ClusterInputItem {
  title: string;
  source: string;
  link?: string;
  pubDate?: string | number;
  publishedAt?: string | number;
  pubDateMissing?: boolean;
  isAlert?: boolean;
  threat?: ClusterThreat;
  tier?: number;
  importanceScore?: number;
  corroborationCount?: number;
  credibilityScore?: number;
}

export interface Cluster {
  primaryTitle: string;
  primarySource: string;
  primaryLink?: string;
  pubDate?: string | number;
  sourceCount: number;
  sources: string[];
  uniquePublisherCount: number;
  lastUpdated: string | number;
  memberTitles: string[];
  sourceTier: number;
  upstreamImportanceScore: number;
  corroborationCount: number;
  credibilityScore?: number;
  isAlert: boolean;
  threat?: ClusterThreat;
  entityCorroboration?: boolean;
  corroborationSourceCount?: number;
}

export interface RankedCluster extends Cluster {
  importanceScore: number;
  effectiveImportanceScore: number;
}

export interface SelectTopStoriesStats {
  considered?: number;
  admissibilityDropped?: number;
  sourceCapDropped?: number;
  overflowDropped?: number;
  briefEligibleConsidered?: number;
  briefEligiblePromoted?: boolean;
}

export const DIPLOMACY_KEYWORDS: string[];
export const ENTITY_BIGRAMS: Array<[string, string]>;
export const MIN_CORROBORATING_PUBLISHERS: number;

export function clusterItems(items: ClusterInputItem[]): Cluster[];
export function publisherFamilyCount(cluster: Cluster): number;
export function scoreImportance(cluster: Cluster, opts?: { demoteFinance?: boolean }): number;
export function recencyWeight(cluster: Cluster, nowMs?: number): number;
export function isBriefLeadEligible(cluster: Cluster): boolean;
export function isTopStoriesAdmissible(cluster: Cluster, score: number): boolean;
export function computeEntityCorroboration(clusters: Cluster[], nowMs?: number): Cluster[];
export function selectTopStories(
  clusters: Cluster[],
  maxCount?: number,
  stats?: SelectTopStoriesStats,
  opts?: { demoteFinance?: boolean },
): RankedCluster[];
