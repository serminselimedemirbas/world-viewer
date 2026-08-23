import type {
  ServerContext,
  GetWorldBriefRequest,
  GetWorldBriefResponse,
  WorldBriefStats,
  BriefCitation,
} from '../../../../src/generated/server/worldmonitor/intelligence/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { callLlm } from '../../../_shared/llm';
import { listFeedDigest } from '../../news/v1/list-feed-digest';
import {
  clusterItems,
  selectTopStories,
  publisherFamilyCount,
  type RankedCluster,
} from '../../../../scripts/_clustering.mjs';
import {
  pickBriefCluster,
  synthesisSystemPrompt,
  synthesisUserPrompt,
  composeSynthesizedBriefResult,
} from '../../../../scripts/_insights-brief.mjs';

// ========================================================================
// Constants
// ========================================================================

// v3: now runs upstream's canonical clustering/synthesis modules directly
// (scripts/_clustering.mjs + scripts/_insights-brief.mjs) instead of the
// hand-copied duplicates this fork carried before the upstream merge.
// Bumped so a cached v2 payload from the copies never serves through this.
const BRIEF_CACHE_KEY = 'intel:world-brief:v3';
const BRIEF_CACHE_TTL = 600; // 10 min — matches the "LIVE · Nm ago" cadence in the app
const MAX_TOP_STORIES = 8;

// ========================================================================
// Fallback lead (no LLM available, or the synthesis gate rejected the draft)
// ========================================================================

function extractiveLead(
  topStories: RankedCluster[],
  criticalCount: number,
  highCount: number,
  sourceCount: number,
  totalCount: number,
): string {
  if (topStories.length === 0) {
    return `No critical or high-priority signals right now. ${totalCount} stories tracked across ${sourceCount} sources.`;
  }
  return `${criticalCount + highCount} high-priority developments across ${sourceCount} sources. Top signal: ${topStories[0]!.primaryTitle}`;
}

// ========================================================================
// RPC handler
// ========================================================================

export async function getWorldBrief(
  ctx: ServerContext,
  _req: GetWorldBriefRequest,
): Promise<GetWorldBriefResponse> {
  const empty: GetWorldBriefResponse = {
    lead: 'Gathering the latest signals…',
    model: '',
    generatedAt: Date.now(),
    stats: { stories: 0, clusters: 0, multiSource: 0, sources: 0, critical: 0, high: 0, alerts: 0 },
    citations: [],
  };

  let result: GetWorldBriefResponse | null = null;
  try {
    result = await cachedFetchJson<GetWorldBriefResponse>(BRIEF_CACHE_KEY, BRIEF_CACHE_TTL, async () => {
      const digest = await listFeedDigest(ctx, { variant: 'full', lang: 'en' });
      const allItems = Object.values(digest.categories ?? {}).flatMap((bucket) => bucket.items ?? []);
      if (allItems.length === 0) return null;

      const clusters = clusterItems(
        allItems.map((item) => ({
          title: item.title,
          source: item.source,
          link: item.link,
          pubDate: item.publishedAt,
          isAlert: item.isAlert,
          threat: item.threat,
        })),
      );

      const topStories = selectTopStories(clusters, MAX_TOP_STORIES);

      const critical = allItems.filter((i) => i.threat?.level === 'THREAT_LEVEL_CRITICAL').length;
      const high = allItems.filter((i) => i.threat?.level === 'THREAT_LEVEL_HIGH').length;
      const alerts = allItems.filter((i) => i.isAlert).length;
      const sourceCount = new Set(allItems.map((i) => i.source)).size;
      const multiSource = clusters.filter((c) => publisherFamilyCount(c) >= 2).length;

      let lead = '';
      let model = '';
      let citations: BriefCitation[] = [];

      // Editorial gate: only synthesize a cited lead when at least one top
      // story is independently corroborated (>=2 publisher families, or
      // entity corroboration) — never a single-source alert.
      const briefCluster = pickBriefCluster(topStories);
      if (briefCluster && topStories.length > 0) {
        const dateISO = new Date().toISOString().split('T')[0]!;
        const llm = await callLlm({
          messages: [
            { role: 'system', content: synthesisSystemPrompt(dateISO) },
            { role: 'user', content: synthesisUserPrompt(topStories) },
          ],
          temperature: 0.4,
          maxTokens: 800,
          stage: 'get-world-brief',
        });
        if (llm?.content) {
          const composed = composeSynthesizedBriefResult(llm.content, topStories, {
            briefCluster,
            // Real URLs instead of the default empty-string fallback — kept
            // in STRICT lockstep with the lead's [n] markers (the composer
            // substitutes rather than filters, so citations[i] is always [i+1]).
            sourceFromStory: (story) => ({
              title: story.primaryTitle,
              source: story.primarySource,
              url: story.primaryLink || '',
            }),
          });
          if (composed.brief) {
            lead = composed.brief.lead;
            model = llm.model;
            citations = composed.brief.sources;
          }
        }
      }

      if (!lead) {
        lead = extractiveLead(topStories, critical, high, sourceCount, allItems.length);
      }

      const stats: WorldBriefStats = {
        stories: allItems.length,
        clusters: clusters.length,
        multiSource,
        sources: sourceCount,
        critical,
        high,
        alerts,
      };

      return { lead, model, generatedAt: Date.now(), stats, citations };
    });
  } catch {
    return empty;
  }

  return result || empty;
}
