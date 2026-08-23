declare const process: { env: Record<string, string | undefined> };

import type {
  ServerContext,
  GetWorldBriefRequest,
  GetWorldBriefResponse,
  WorldBriefStats,
} from '../../../../src/generated/server/worldmonitor/intelligence/v1/service_server';
import type { NewsItem } from '../../../../src/generated/server/worldmonitor/news/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { CHROME_UA } from '../../../_shared/constants';
import { UPSTREAM_TIMEOUT_MS, GROQ_API_URL, GROQ_MODEL } from './_shared';
import { briefDateLine, checkLeadGrounding } from '../../../_shared/brief-llm-core';
import { listFeedDigest } from '../../news/v1/list-feed-digest';

// ========================================================================
// Constants
// ========================================================================

const BRIEF_CACHE_KEY = 'intel:world-brief:v1';
const BRIEF_CACHE_TTL = 600; // 10 min — matches the "LIVE · Nm ago" cadence in the app
const MAX_PROMPT_STORIES = 8;
const CLUSTER_JACCARD_THRESHOLD = 0.55; // mirrors worldmonitor.app's documented Jaccard fallback
const CLUSTER_MAX_SOURCES = 5;

// ========================================================================
// Story clustering (title corroboration, no embeddings)
// ========================================================================

function normalizedWords(title: string): Set<string> {
  const normalized = title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  return new Set(normalized.split(' ').filter((w) => w.length >= 4));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  return intersection / Math.min(a.size, b.size);
}

/**
 * Groups items whose titles corroborate the same story (word-overlap ≥
 * CLUSTER_JACCARD_THRESHOLD), capping sources counted per cluster at
 * CLUSTER_MAX_SOURCES. Ported from worldmonitor.app's documented
 * Jaccard-fallback dedup approach (their default path uses embeddings;
 * this fork has no embedding model deployed, so we use their fallback
 * threshold directly rather than pull in an embedding dependency).
 */
function clusterStories(items: NewsItem[]): { clusters: number; multiSource: number } {
  const clusters: Array<{ words: Set<string>; sources: Set<string> }> = [];

  for (const item of items) {
    const words = normalizedWords(item.title);
    let target = clusters.find((c) => jaccard(words, c.words) >= CLUSTER_JACCARD_THRESHOLD);
    if (!target) {
      target = { words, sources: new Set() };
      clusters.push(target);
    }
    if (target.sources.size < CLUSTER_MAX_SOURCES) target.sources.add(item.source);
  }

  const multiSource = clusters.filter((c) => c.sources.size >= 2).length;
  return { clusters: clusters.length, multiSource };
}

// ========================================================================
// Lead synthesis
// ========================================================================

function extractiveLead(topItems: NewsItem[], criticalCount: number, highCount: number, sourceCount: number, totalCount: number): string {
  if (topItems.length === 0) {
    return `No critical or high-priority signals right now. ${totalCount} stories tracked across ${sourceCount} sources.`;
  }
  const top = topItems[0]!;
  return `${criticalCount + highCount} high-priority developments across ${sourceCount} sources. Top signal: ${top.title}`;
}

async function synthesizeLead(topItems: NewsItem[]): Promise<{ lead: string; model: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || topItems.length === 0) return null;

  const dateStr = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are the editor of a geopolitical situation brief. ${briefDateLine(dateStr)}

Write ONE short paragraph (2-3 sentences, 40-70 words) synthesizing the most important developments from the headlines below. Editorial, impersonal, serious. No preamble, no markdown, no bullet points, no fabricated names/numbers/dates beyond what the headlines state.`;

  const userPrompt = topItems
    .map((item, i) => `${i + 1}. [${item.threat?.level ?? 'UNKNOWN'}] ${item.title} (${item.source})`)
    .join('\n');

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
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!resp.ok) return null;

    const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const lead = data.choices?.[0]?.message?.content?.trim() || '';
    if (!lead || lead.length < 20) return null;

    // Grounding gate (ported from worldmonitor.app): reject a lead that
    // doesn't share a proper-noun anchor with the source headlines rather
    // than risk shipping a fabricated synthesis.
    const grounded = checkLeadGrounding({ lead }, topItems.map((i) => ({ headline: i.title })));
    if (!grounded) return null;

    return { lead, model: GROQ_MODEL };
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

      const critical = allItems.filter((i) => i.threat?.level === 'THREAT_LEVEL_CRITICAL');
      const high = allItems.filter((i) => i.threat?.level === 'THREAT_LEVEL_HIGH');
      const alerts = allItems.filter((i) => i.isAlert);
      const sources = new Set(allItems.map((i) => i.source));

      const topItems = [...critical, ...high]
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, MAX_PROMPT_STORIES);

      const synthesis = await synthesizeLead(topItems);
      const lead = synthesis?.lead ?? extractiveLead(topItems, critical.length, high.length, sources.size, allItems.length);
      const model = synthesis?.model ?? '';

      const { clusters, multiSource } = clusterStories(allItems);

      const stats: WorldBriefStats = {
        stories: allItems.length,
        clusters,
        multiSource,
        sources: sources.size,
        critical: critical.length,
        high: high.length,
        alerts: alerts.length,
      };

      return { lead, model, generatedAt: Date.now(), stats };
    });
  } catch {
    return empty;
  }

  return result || empty;
}
