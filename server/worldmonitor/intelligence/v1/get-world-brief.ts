declare const process: { env: Record<string, string | undefined> };

import type {
  ServerContext,
  GetWorldBriefRequest,
  GetWorldBriefResponse,
  WorldBriefStats,
} from '../../../../src/generated/server/worldmonitor/intelligence/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { CHROME_UA } from '../../../_shared/constants';
import { UPSTREAM_TIMEOUT_MS, GROQ_API_URL, GROQ_MODEL } from './_shared';
import { listFeedDigest } from '../../news/v1/list-feed-digest';
import { clusterItems, selectTopStories, publisherFamilyCount } from './_clustering';
import {
  pickBriefCluster,
  synthesisSystemPrompt,
  synthesisUserPrompt,
  composeSynthesizedBriefResult,
} from './_insights-brief';

// ========================================================================
// Constants
// ========================================================================

// v2: real clustering/scoring/synthesis pipeline (ported from
// worldmonitor.app's scripts/_clustering.mjs + _insights-brief.mjs), not
// the v1 Jaccard approximation — bump the cache key so a stale v1 payload
// never masquerades as the richer shape.
const BRIEF_CACHE_KEY = 'intel:world-brief:v2';
const BRIEF_CACHE_TTL = 600; // 10 min — matches the "LIVE · Nm ago" cadence in the app
const MAX_TOP_STORIES = 8;

// ========================================================================
// Fallback lead (no LLM key, or the synthesis gate rejected the draft)
// ========================================================================

function extractiveLead(
  topStories: Array<{ primaryTitle: string }>,
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

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const resp = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'User-Agent': CHROME_UA },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
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

      // Editorial gate (ported): only synthesize a cited lead when at least
      // one top story is independently corroborated (>=2 publishers, or
      // entity corroboration) — never a single-source alert.
      const briefCluster = pickBriefCluster(topStories);
      if (briefCluster && topStories.length > 0) {
        const dateISO = new Date().toISOString().split('T')[0]!;
        const raw = await callGroq(synthesisSystemPrompt(dateISO), synthesisUserPrompt(topStories));
        if (raw) {
          const composed = composeSynthesizedBriefResult(raw, topStories, { briefCluster });
          if (composed.brief) {
            lead = composed.brief.lead;
            model = GROQ_MODEL;
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

      return { lead, model, generatedAt: Date.now(), stats };
    });
  } catch {
    return empty;
  }

  return result || empty;
}
