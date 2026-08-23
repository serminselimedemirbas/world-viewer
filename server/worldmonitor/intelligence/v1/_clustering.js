/**
 * Story clustering + importance scoring for the AI World Brief.
 *
 * Ported from worldmonitor.app's scripts/_clustering.mjs (commit
 * 902cd7a16, AGPL-3.0). Algorithm and comments kept verbatim; only the
 * module-loading shim changed — upstream juggles four runtimes (Railway
 * nixpacks, Vercel edge, Vite browser, plain Node) via `createRequire` for
 * its JSON data files. A plain `import x from './y.json'` throws
 * ERR_IMPORT_ATTRIBUTE_MISSING under modern Node ESM without an explicit
 * `with { type: 'json' }` attribute (confirmed by hand — upstream's own
 * shared/publisher-families.js doc comment flags this exact failure mode),
 * so source-tiers.json and diplomacy-keywords.json were converted to plain
 * `.js` modules exporting the same data as a JS object literal — sidesteps
 * the ESM JSON-import-attribute question entirely, matching this fork's
 * existing convention of inlining reference data (e.g. TIER1_COUNTRIES in
 * ./_shared.ts) rather than importing JSON.
 *
 * One deliberate behavior change, flagged inline at `isLlmThreatSource`:
 * this fork's threat classifier (server/worldmonitor/news/v1/_classifier.ts)
 * is keyword-only — there is no separate LLM classify-cache stage feeding
 * list-feed-digest the way upstream's dual keyword+LLM pipeline does. Score
 * threat level fully for our classifier's 'keyword' source rather than
 * zeroing it out (upstream discounts keyword-only threat levels by 0.35x
 * specifically because it ALSO has a higher-confidence LLM signal available
 * when present — we don't, so keyword is the authoritative signal here).
 */

import { clusterTexts } from '../../../_shared/story-identity.js';
import {
  MIN_CORROBORATING_PUBLISHERS,
  countPublisherFamilies,
  publisherFamiliesFor,
} from '../../../_shared/publisher-families.js';
import { SOURCE_TIERS } from '../../../_shared/source-tiers.js';
import { DIPLOMACY_KEYWORDS_DATA } from '../../../_shared/diplomacy-keywords.js';

const ENTITY_CORROBORATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const MILITARY_KEYWORDS = [
  'war', 'armada', 'invasion', 'airstrike', 'strike', 'missile', 'troops',
  'deployed', 'offensive', 'artillery', 'bomb', 'combat', 'fleet', 'warship',
  'carrier', 'navy', 'airforce', 'deployment', 'mobilization', 'attack',
];

const VIOLENCE_KEYWORDS = [
  'killed', 'dead', 'death', 'shot', 'blood', 'massacre', 'slaughter',
  'fatalities', 'casualties', 'wounded', 'injured', 'murdered', 'execution',
  'crackdown', 'violent', 'clashes', 'gunfire', 'shooting',
];

const UNREST_KEYWORDS = [
  'protest', 'protests', 'uprising', 'revolt', 'revolution', 'riot', 'riots',
  'demonstration', 'unrest', 'dissent', 'rebellion', 'insurgent', 'overthrow',
  'coup', 'martial law', 'curfew', 'shutdown', 'blackout',
];

const FLASHPOINT_KEYWORDS = DIPLOMACY_KEYWORDS_DATA.flashpointKeywords;
export const DIPLOMACY_KEYWORDS = DIPLOMACY_KEYWORDS_DATA.diplomacyKeywords;
export const ENTITY_BIGRAMS = DIPLOMACY_KEYWORDS_DATA.diplomacyFlashpointPairs;

const CRISIS_KEYWORDS = [
  'crisis', 'emergency', 'catastrophe', 'disaster', 'collapse', 'humanitarian',
  'sanctions', 'ultimatum', 'threat', 'retaliation', 'escalation', 'tensions',
  'breaking', 'urgent', 'developing', 'exclusive',
];

const DEMOTE_KEYWORDS = [
  'ceo', 'earnings', 'stock', 'startup', 'data center', 'datacenter', 'revenue',
  'quarterly', 'profit', 'investor', 'ipo', 'funding', 'valuation',
];

function finiteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toFiniteMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function getItemPubMs(item) {
  if (item?.pubDateMissing === true) return 0;
  return toFiniteMs(item?.pubDate ?? item?.publishedAt ?? item?.date);
}

function normalizeSourceName(source) {
  return typeof source === 'string' ? source.trim() : '';
}

function sourceTierFor(source) {
  const tier = SOURCE_TIERS[source];
  return Number.isFinite(tier) ? tier : 4;
}

function sourceTierForSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return 4;
  return Math.min(...sources.map(sourceTierFor));
}

function normalizeThreatLevel(level) {
  if (typeof level !== 'string') return '';
  const upper = level.toUpperCase();
  if (upper.startsWith('THREAT_LEVEL_')) {
    const suffix = upper.slice('THREAT_LEVEL_'.length).toLowerCase();
    return suffix === 'unspecified' ? 'info' : suffix;
  }
  return level.toLowerCase();
}

// Adapted — see module doc: this fork has no separate LLM classify-cache
// stage, so 'keyword' (server/worldmonitor/news/v1/_classifier.ts) is
// treated as the authoritative threat source rather than a discounted one.
function isLlmThreatSource(source) {
  return source === 'llm' || source === 'keyword';
}

function normalizedMatchText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Word-start containment in normalizedMatchText output. Mirrors
// shared/brief-filter.js:containsKeywordToken — prevents 'pact' inside
// 'impact' (false positive) while still matching 'iran' inside
// 'iranian' (demonym preserved). PR #3909 review (P2).
function containsKeywordToken(text, kw) {
  if (!kw) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\s)${escaped}`).test(text);
}

export function clusterItems(items) {
  if (items.length === 0) return [];

  const clusters = clusterTexts(items.map(item => item.title || ''))
    .map(indices => indices.map(idx => items[idx]));

  return clusters.map(group => {
    const sorted = [...group].sort((a, b) => {
      const tierA = finiteNumber(a.tier, sourceTierFor(a.source));
      const tierB = finiteNumber(b.tier, sourceTierFor(b.source));
      const tierDiff = tierA - tierB;
      if (tierDiff !== 0) return tierDiff;
      return getItemPubMs(b) - getItemPubMs(a);
    });

    const primary = sorted[0];
    const sources = [...new Set(group.map(i => normalizeSourceName(i.source)).filter(Boolean))]
      .sort((a, b) => sourceTierFor(a) - sourceTierFor(b) || a.localeCompare(b));
    const sourceTier = sourceTierForSources(sources);
    const publishedTimes = group.map(getItemPubMs).filter(ms => ms > 0);
    const lastUpdatedMs = publishedTimes.length > 0 ? Math.max(...publishedTimes) : getItemPubMs(primary);
    const upstreamImportanceScore = group.reduce(
      (max, item) => Math.max(max, finiteNumber(item.importanceScore, 0)),
      0,
    );
    const corroborationCount = group.reduce((max, item) => {
      const itemCount = finiteNumber(item.corroborationCount ?? item.storyMeta?.sourceCount, 0);
      return Math.max(max, itemCount);
    }, 0);
    const threatItem = sorted.find(i => i.threat?.level && isLlmThreatSource(i.threat?.source));
    return {
      primaryTitle: primary.title,
      primarySource: primary.source,
      primaryLink: primary.link,
      pubDate: primary.pubDate,
      sourceCount: group.length,
      sources,
      uniquePublisherCount: countPublisherFamilies(sources),
      lastUpdated: lastUpdatedMs > 0 ? new Date(lastUpdatedMs).toISOString() : primary.pubDate,
      memberTitles: group.map(i => i.title).filter(Boolean),
      sourceTier,
      upstreamImportanceScore,
      corroborationCount,
      ...(Number.isFinite(primary.credibilityScore) ? { credibilityScore: primary.credibilityScore } : {}),
      isAlert: group.some(i => i.isAlert),
      threat: threatItem?.threat ? { ...threatItem.threat } : (primary.threat ? { ...primary.threat } : undefined),
    };
  });
}

function countMatches(text, keywords) {
  return keywords.filter(kw => text.includes(kw)).length;
}

export function publisherFamilyCount(cluster) {
  return Math.max(
    countPublisherFamilies(cluster?.sources),
    finiteNumber(cluster?.corroborationSourceCount, 0),
    finiteNumber(cluster?.corroborationCount, 0),
    1,
  );
}

function hasStrongNonKeywordSignal(cluster) {
  const level = normalizeThreatLevel(cluster.threat?.level);
  return isLlmThreatSource(cluster.threat?.source) && (level === 'high' || level === 'critical');
}

export function scoreImportance(cluster, opts = {}) {
  let score = 0;
  const titleLower = normalizedMatchText(cluster.primaryTitle);
  const upstream = finiteNumber(cluster.upstreamImportanceScore, 0);
  if (upstream > 0) score += upstream * 2.2;

  const level = normalizeThreatLevel(cluster.threat?.level);
  const threatScores = { critical: 220, high: 150, medium: 80, low: 20, info: 0 };
  if (level && isLlmThreatSource(cluster.threat?.source)) {
    score += threatScores[level] ?? 0;
  } else if (level && upstream > 0 && cluster.threat?.source !== 'keyword-historical-downgrade') {
    score += (threatScores[level] ?? 0) * 0.35;
  }

  const sourceTier = finiteNumber(cluster.sourceTier, sourceTierFor(cluster.primarySource));
  score += sourceTier === 1 ? 35 : sourceTier === 2 ? 20 : sourceTier === 3 ? 8 : 0;

  const publishersN = publisherFamilyCount(cluster);
  score += Math.min(publishersN, 6) * 12;
  if (cluster.entityCorroboration) score += 45;

  const violenceN = countMatches(titleLower, VIOLENCE_KEYWORDS);
  if (violenceN > 0) score += 50 + violenceN * 12;

  const militaryN = countMatches(titleLower, MILITARY_KEYWORDS);
  if (militaryN > 0) score += 40 + militaryN * 10;

  const unrestN = countMatches(titleLower, UNREST_KEYWORDS);
  if (unrestN > 0) score += 35 + unrestN * 9;

  const flashpointN = countMatches(titleLower, FLASHPOINT_KEYWORDS);
  if (flashpointN > 0) score += 30 + flashpointN * 8;

  const diplomacyN = countMatches(titleLower, DIPLOMACY_KEYWORDS);
  if (diplomacyN > 0) score += 35 + diplomacyN * 9;
  if ((violenceN > 0 || unrestN > 0 || diplomacyN > 0) && flashpointN > 0) score *= 1.25;

  const crisisN = countMatches(titleLower, CRISIS_KEYWORDS);
  if (crisisN > 0) score += 15 + crisisN * 5;

  const demoteN = countMatches(titleLower, DEMOTE_KEYWORDS);
  const demoteFinance = opts.demoteFinance !== false;
  if (demoteFinance && demoteN > 0 && !cluster.entityCorroboration && !hasStrongNonKeywordSignal(cluster)) score *= 0.35;

  return score;
}

export function recencyWeight(cluster, nowMs = Date.now()) {
  const updatedMs = toFiniteMs(cluster?.lastUpdated ?? cluster?.pubDate);
  if (updatedMs <= 0) return 1;
  const ageHours = Math.max(0, (nowMs - updatedMs) / 3600000);
  return Math.max(0.5, 1 - ageHours / 16);
}

export { MIN_CORROBORATING_PUBLISHERS };

export function isBriefLeadEligible(cluster) {
  return countPublisherFamilies(cluster?.sources) >= MIN_CORROBORATING_PUBLISHERS
    || cluster?.entityCorroboration === true;
}

export function isTopStoriesAdmissible(cluster, score) {
  return isBriefLeadEligible(cluster) || cluster?.isAlert === true || score > 100;
}

function entityKeysForCluster(cluster) {
  const titles = Array.isArray(cluster.memberTitles) && cluster.memberTitles.length > 0
    ? cluster.memberTitles
    : [cluster.primaryTitle];
  const keys = new Set();
  for (const title of titles) {
    const text = normalizedMatchText(title);
    for (const [entity, action] of ENTITY_BIGRAMS) {
      if (containsKeywordToken(text, entity) && containsKeywordToken(text, action)) {
        keys.add(`${entity}:${action}`);
      }
    }
  }
  return keys;
}

export function computeEntityCorroboration(clusters, nowMs = Date.now()) {
  if (!Array.isArray(clusters) || clusters.length === 0) return clusters;
  const buckets = new Map();
  for (const cluster of clusters) {
    cluster.entityCorroboration = false;
    cluster.corroborationSourceCount = 0;
    const updatedMs = toFiniteMs(cluster.lastUpdated ?? cluster.pubDate);
    if (updatedMs <= 0 || nowMs - updatedMs > ENTITY_CORROBORATION_WINDOW_MS) continue;
    for (const key of entityKeysForCluster(cluster)) {
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { clusters: [], sources: new Set() };
        buckets.set(key, bucket);
      }
      bucket.clusters.push(cluster);
      for (const family of publisherFamiliesFor(cluster.sources)) {
        bucket.sources.add(family);
      }
    }
  }

  for (const bucket of buckets.values()) {
    if (bucket.sources.size < MIN_CORROBORATING_PUBLISHERS) continue;
    for (const cluster of bucket.clusters) {
      cluster.entityCorroboration = true;
      cluster.corroborationSourceCount = Math.max(
        finiteNumber(cluster.corroborationSourceCount, 0),
        bucket.sources.size,
      );
    }
  }
  return clusters;
}

export function selectTopStories(clusters, maxCount = 8, stats, opts = {}) {
  if (stats && typeof stats === 'object' && 'demoteFinance' in stats
      && (!opts || Object.keys(opts).length === 0)) {
    opts = stats;
    stats = undefined;
  }
  const nowMs = Date.now();
  computeEntityCorroboration(clusters, nowMs);
  const admissible = [];
  let admissibilityDropped = 0;
  for (const c of clusters) {
    const score = scoreImportance(c, opts);
    if (isTopStoriesAdmissible(c, score)) {
      admissible.push({ cluster: c, score, effectiveScore: score * recencyWeight(c, nowMs) });
    } else {
      admissibilityDropped++;
    }
  }
  admissible.sort((a, b) => b.effectiveScore - a.effectiveScore || b.score - a.score);

  const MAX_PER_SOURCE = 3;

  const fill = (seed) => {
    const selected = [];
    const sourceCount = new Map();
    let sourceCapDropped = 0;
    let overflowDropped = 0;
    const take = ({ cluster, score, effectiveScore }) => {
      selected.push({ ...cluster, importanceScore: score, effectiveImportanceScore: effectiveScore });
      sourceCount.set(cluster.primarySource, (sourceCount.get(cluster.primarySource) || 0) + 1);
    };
    if (seed && maxCount > 0) take(seed);
    for (const entry of admissible) {
      if (entry === seed) continue;
      const source = entry.cluster.primarySource;
      const count = sourceCount.get(source) || 0;
      if (count >= MAX_PER_SOURCE) {
        sourceCapDropped++;
        continue;
      }
      if (selected.length >= maxCount) {
        overflowDropped++;
        continue;
      }
      take(entry);
    }
    selected.sort((a, b) => b.effectiveImportanceScore - a.effectiveImportanceScore
      || b.importanceScore - a.importanceScore);
    return { selected, sourceCapDropped, overflowDropped };
  };

  let result = fill(null);

  const briefEligible = admissible.filter(entry => isBriefLeadEligible(entry.cluster));
  const promoted = maxCount > 0 && !result.selected.some(isBriefLeadEligible)
    ? (briefEligible[0] ?? null)
    : null;
  if (promoted) result = fill(promoted);

  if (stats && typeof stats === 'object') {
    stats.considered = clusters.length;
    stats.admissibilityDropped = admissibilityDropped;
    stats.sourceCapDropped = result.sourceCapDropped;
    stats.overflowDropped = result.overflowDropped;
    stats.briefEligibleConsidered = briefEligible.length;
    stats.briefEligiblePromoted = promoted != null;
  }

  return result.selected;
}
