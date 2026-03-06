/**
 * GET /api/youtube/sources
 *
 * Returns current video IDs for all news channels and webcam feeds.
 * News channels: live video IDs are auto-detected via the Railway relay.
 * Webcam feeds:  static fallback IDs (update manually when streams expire).
 * Cached 5 minutes on the CDN edge.
 */

export const config = { runtime: 'edge' };

import { getCorsHeaders, isDisallowedOrigin } from '../_cors.js';
// @ts-expect-error — JS module
import { validateApiKey } from '../_api-key.js';

// ---------------------------------------------------------------------------
// Channel / feed definitions
// ---------------------------------------------------------------------------

const NEWS_CHANNELS = [
  // Americas
  { id: 'bloomberg',    name: 'Bloomberg',    region: 'americas',    handle: '@Bloomberg',        fallbackVideoId: 'iEpJwprxDdk' },
  { id: 'cnbc',         name: 'CNBC',         region: 'americas',    handle: '@CNBC',             fallbackVideoId: '9NyxcX3rhQs' },
  { id: 'cnn',          name: 'CNN',          region: 'americas',    handle: '@CNN',              fallbackVideoId: 'w_Ma8oQLmSM' },
  { id: 'fox-news',     name: 'Fox News',     region: 'americas',    handle: '@FoxNews',          fallbackVideoId: 'QaftgYkG-ek' },
  { id: 'cbs-news',     name: 'CBS News',     region: 'americas',    handle: '@CBSNews',          fallbackVideoId: 'R9L8sDK8iEc' },
  { id: 'nbc-news',     name: 'NBC News',     region: 'americas',    handle: '@NBCNews',          fallbackVideoId: 'yMr0neQhu6c' },
  { id: 'cbc-news',     name: 'CBC News',     region: 'americas',    handle: '@CBCNews',          fallbackVideoId: 'jxP_h3V-Dv8' },
  // Europe
  { id: 'sky',          name: 'Sky News',     region: 'europe',      handle: '@SkyNews',          fallbackVideoId: 'uvviIF4725I' },
  { id: 'euronews',     name: 'Euronews',     region: 'europe',      handle: '@euronews',         fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw',           name: 'DW',           region: 'europe',      handle: '@DWNews',           fallbackVideoId: 'LuKwFajn37U' },
  { id: 'france24',     name: 'France 24',    region: 'europe',      handle: '@France24English',  fallbackVideoId: 'u9foWyMSETk' },
  { id: 'bbc-news',     name: 'BBC News',     region: 'europe',      handle: '@BBCNews',          fallbackVideoId: 'bjgQzJzCZKs' },
  { id: 'trt-haber',    name: 'TRT Haber',    region: 'europe',      handle: '@trthaber',         fallbackVideoId: '3XHebGJG0bc' },
  { id: 'tagesschau24', name: 'Tagesschau24', region: 'europe',      handle: '@Tagesschau',       fallbackVideoId: 'fC_q9TkO1uU' },
  // Asia
  { id: 'nhk-world',    name: 'NHK World',    region: 'asia',        handle: '@NHKWorldNews',     fallbackVideoId: 'f0lYfG_vY_U' },
  { id: 'cna-asia',     name: 'CNA',          region: 'asia',        handle: '@ChannelNewsAsia',  fallbackVideoId: 'XWq5kBlakcQ' },
  { id: 'india-today',  name: 'India Today',  region: 'asia',        handle: '@IndiaToday',       fallbackVideoId: 'sYZtOFzM78M' },
  { id: 'tbs-news',     name: 'TBS News',     region: 'asia',        handle: '@tbsnewsdig',       fallbackVideoId: 'aUDm173E8k8' },
  { id: 'abc-news-au',  name: 'ABC Australia',region: 'asia',        handle: '@ABCaustralia',     fallbackVideoId: 'vOTiJkg1voo' },
  // Middle East
  { id: 'aljazeera',    name: 'Al Jazeera',   region: 'middle-east', handle: '@AlJazeeraEnglish', fallbackVideoId: 'gCNeDWCI0vo' },
  { id: 'alarabiya',    name: 'Al Arabiya',   region: 'middle-east', handle: '@AlArabiyaChannel', fallbackVideoId: 'n7eQejkXbnM' },
  { id: 'trt-world',    name: 'TRT World',    region: 'middle-east', handle: '@TRTWorld',         fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'sky-arabia',   name: 'Sky Arabia',   region: 'middle-east', handle: '@SkyNewsArabia',    fallbackVideoId: 'U--OjmpjF5o' },
  { id: 'kan-11',       name: 'Kan 11',       region: 'middle-east', handle: '@kann11',           fallbackVideoId: 'TCnaIE_SAtM' },
  // Africa
  { id: 'arise-news',   name: 'Arise News',   region: 'africa',      handle: '@ARISENewsTV',      fallbackVideoId: '4uHZdlX-DT4' },
  { id: 'ktn-news',     name: 'KTN News',     region: 'africa',      handle: '@KTNNewsKenya',     fallbackVideoId: 'RmHtsdVb3mo' },
];

// Webcam feeds don't have reliable channel handles — manual fallback IDs only.
const WEBCAM_FEEDS = [
  // Iran Attacks
  { id: 'iran-tehran',    city: 'Tehran',         country: 'Iran',         region: 'iran',        videoId: '-zGuR1qVKrU' },
  { id: 'iran-telaviv',   city: 'Tel Aviv',       country: 'Israel',       region: 'iran',        videoId: 'gmtlJ_m2r5A' },
  { id: 'iran-jerusalem', city: 'Jerusalem',      country: 'Israel',       region: 'iran',        videoId: 'JHwwZRH2wz8' },
  { id: 'iran-multicam',  city: 'Middle East',    country: 'Multi',        region: 'iran',        videoId: '4E-iFtUM2kk' },
  // Middle East
  { id: 'jerusalem',      city: 'Jerusalem',      country: 'Israel',       region: 'middle-east', videoId: 'UyduhBUpO7Q' },
  { id: 'tehran',         city: 'Tehran',         country: 'Iran',         region: 'middle-east', videoId: '-zGuR1qVKrU' },
  { id: 'tel-aviv',       city: 'Tel Aviv',       country: 'Israel',       region: 'middle-east', videoId: 'gmtlJ_m2r5A' },
  { id: 'mecca',          city: 'Mecca',          country: 'Saudi Arabia', region: 'middle-east', videoId: 'DEcpmPUbkDQ' },
  // Europe
  { id: 'kyiv',           city: 'Kyiv',           country: 'Ukraine',      region: 'europe',      videoId: '-Q7FuPINDjA' },
  { id: 'odessa',         city: 'Odessa',         country: 'Ukraine',      region: 'europe',      videoId: 'e2gC37ILQmk' },
  { id: 'paris',          city: 'Paris',          country: 'France',       region: 'europe',      videoId: 'OzYp4NRZlwQ' },
  { id: 'st-petersburg',  city: 'St. Petersburg', country: 'Russia',       region: 'europe',      videoId: 'CjtIYbmVfck' },
  { id: 'london',         city: 'London',         country: 'UK',           region: 'europe',      videoId: 'Lxqcg1qt0XU' },
  // Americas
  { id: 'washington',     city: 'Washington',     country: 'USA',          region: 'americas',    videoId: '1wV9lLe14aU' },
  { id: 'new-york',       city: 'New York',       country: 'USA',          region: 'americas',    videoId: '4qyZLflp-sI' },
  { id: 'los-angeles',    city: 'Los Angeles',    country: 'USA',          region: 'americas',    videoId: 'EO_1LWqsCNE' },
  { id: 'miami',          city: 'Miami',          country: 'USA',          region: 'americas',    videoId: '5YCajRjvWCg' },
  // Asia
  { id: 'taipei',         city: 'Taipei',         country: 'Taiwan',       region: 'asia',        videoId: 'z_fY1pj1VBw' },
  { id: 'shanghai',       city: 'Shanghai',       country: 'China',        region: 'asia',        videoId: '76EwqI5XZIc' },
  { id: 'tokyo',          city: 'Tokyo',          country: 'Japan',        region: 'asia',        videoId: '4pu9sF5Qssw' },
  { id: 'seoul',          city: 'Seoul',          country: 'South Korea',  region: 'asia',        videoId: '-JhoMGoAfFc' },
  { id: 'sydney',         city: 'Sydney',         country: 'Australia',    region: 'asia',        videoId: '7pcL-0Wo77U' },
];

// ---------------------------------------------------------------------------
// Relay helpers (same pattern as live.js)
// ---------------------------------------------------------------------------

function getRelayBaseUrl() {
  const url = process.env.WS_RELAY_URL;
  if (!url) return null;
  return url.replace('wss://', 'https://').replace('ws://', 'http://').replace(/\/$/, '');
}

function getRelayHeaders() {
  const secret = process.env.RELAY_SHARED_SECRET || '';
  const headers = { 'User-Agent': 'WorldMonitor-Edge/1.0' };
  if (secret) {
    const headerName = (process.env.RELAY_AUTH_HEADER || 'x-relay-key').toLowerCase();
    headers[headerName] = secret;
    headers['Authorization'] = `Bearer ${secret}`;
  }
  return headers;
}

/**
 * Fetch the current live video ID for a YouTube channel handle via the relay.
 * Returns null if unavailable or not currently live.
 */
async function fetchLiveVideoId(relayBase, relayHeaders, handle) {
  if (!relayBase) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `${relayBase}/youtube-live?channel=${encodeURIComponent(handle)}`,
      { headers: relayHeaders, signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.isLive && data.videoId ? data.videoId : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(request) {
  const cors = getCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (isDisallowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const keyCheck = validateApiKey(request);
  if (keyCheck.required && !keyCheck.valid) {
    return new Response(JSON.stringify({ error: keyCheck.error }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Attempt live-ID detection for all news channels in parallel via the relay.
  const relayBase = getRelayBaseUrl();
  const relayHeaders = getRelayHeaders();

  const liveResults = await Promise.allSettled(
    NEWS_CHANNELS.map((ch) =>
      fetchLiveVideoId(relayBase, relayHeaders, ch.handle).then((videoId) => ({
        id: ch.id,
        videoId,
      })),
    ),
  );

  const liveIdMap = {};
  for (const result of liveResults) {
    if (result.status === 'fulfilled' && result.value.videoId) {
      liveIdMap[result.value.id] = result.value.videoId;
    }
  }

  const newsChannels = NEWS_CHANNELS.map((ch) => ({
    id: ch.id,
    name: ch.name,
    region: ch.region,
    videoId: liveIdMap[ch.id] ?? ch.fallbackVideoId,
  }));

  const body = JSON.stringify({ newsChannels, webcamFeeds: WEBCAM_FEEDS });

  return new Response(body, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      // 5-min CDN cache — relay is called at most once per 5 min globally
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60, stale-if-error=3600',
    },
  });
}
