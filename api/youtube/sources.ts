/**
 * GET /api/youtube/sources
 *
 * Current video IDs, brand colours and HLS URLs for every news channel and
 * webcam feed the iOS app lists.
 *
 * Migrated from the Next.js landing site, which carried the newer
 * implementation: HLS-first resolution, per-channel brand colour, and
 * YouTube live-detection done inline (no Railway relay dependency). The
 * previous sources.js here returned neither `color` nor `hlsUrl`, both of
 * which the iOS client reads, so those degraded silently.
 *
 * Public read endpoint — CORS only, no API key, matching api/youtube/live.js.
 */

export const config = { runtime: 'edge' };

// @ts-expect-error — JS module, no declaration file
import { getCorsHeaders, isDisallowedOrigin } from '../_cors.js';

// Native implementation — replaces the legacy-fork redirect. Channel resolution
// logic (HLS-first, YouTube live-detect second, pinned fallback last) mirrors
// https://github.com/koala73/worldmonitor/blob/main/src/components/LiveNewsPanel.ts
// Webcam feeds are still the static list from the iOS app (unchanged, out of scope
// for this migration — upstream's current "webcams" is a different, geospatial
// feature backed by Redis, not per-city YouTube streams).


interface NewsChannelDef {
  id: string;
  name: string;
  region: string;
  color: string; // channel's own brand color, hex — drives the "Open in X" button
  handle?: string; // YouTube handle for live-detection, e.g. "@CNN"
  fallbackVideoId?: string; // pinned known-good video id, last resort
  hlsUrl?: string; // broadcaster's own public HLS stream — takes precedence over YouTube
}

const NEWS_CHANNELS: NewsChannelDef[] = [
  { id: "bloomberg", name: "Bloomberg", region: "americas", color: "#000000", handle: "@markets", fallbackVideoId: "iEpJwprxDdk", hlsUrl: "https://bloomberg.com/media-manifest/streams/us.m3u8" },
  { id: "cnbc", name: "CNBC", region: "americas", color: "#005594", handle: "@CNBC", fallbackVideoId: "9NyxcX3rhQs" },
  { id: "cnn", name: "CNN", region: "americas", color: "#CC0000", handle: "@CNN", fallbackVideoId: "w_Ma8oQLmSM", hlsUrl: "https://turnerlive.warnermediacdn.com/hls/live/586495/cnngo/cnn_slate/VIDEO_0_3564000.m3u8" },
  { id: "fox-news", name: "Fox News", region: "americas", color: "#003DA5", handle: "@FoxNews", fallbackVideoId: "QaftgYkG-ek" },
  { id: "cbs-news", name: "CBS News", region: "americas", color: "#0057B8", handle: "@CBSNews", fallbackVideoId: "R9L8sDK8iEc", hlsUrl: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" },
  { id: "nbc-news", name: "NBC News", region: "americas", color: "#0C2340", handle: "@NBCNews", fallbackVideoId: "yMr0neQhu6c", hlsUrl: "https://dai2.xumo.com/amagi_hls_data_xumo1212A-xumo-nbcnewsnow/CDN/master.m3u8" },
  { id: "cbc-news", name: "CBC News", region: "americas", color: "#E60000", handle: "@CBCNews", fallbackVideoId: "jxP_h3V-Dv8", hlsUrl: "https://cbcnewshd-f.akamaihd.net/i/cbcnews_1@8981/index_2500_av-p.m3u8" },
  { id: "sky", name: "Sky News", region: "europe", color: "#E60000", handle: "@SkyNews", fallbackVideoId: "uvviIF4725I", hlsUrl: "https://linear901-oo-hls0-prd-gtm.delivery.skycdp.com/17501/sde-fast-skynews/master.m3u8" },
  { id: "euronews", name: "Euronews", region: "europe", color: "#003DA5", handle: "@euronews", fallbackVideoId: "pykpO5kQJ98", hlsUrl: "https://dash4.antik.sk/live/test_euronews/playlist.m3u8" },
  { id: "dw", name: "DW", region: "europe", color: "#00549F", handle: "@DWNews", fallbackVideoId: "LuKwFajn37U", hlsUrl: "https://dwamdstream103.akamaized.net/hls/live/2015526/dwstream103/master.m3u8" },
  { id: "france24", name: "France 24", region: "europe", color: "#0055A4", handle: "@FRANCE24", fallbackVideoId: "u9foWyMSETk", hlsUrl: "https://amg00106-france24-france24-samsunguk-qvpp8.amagi.tv/playlist/amg00106-france24-france24-samsunguk/playlist.m3u8" },
  { id: "bbc-news", name: "BBC News", region: "europe", color: "#BB1919", handle: "@BBCNews", fallbackVideoId: "bjgQzJzCZKs", hlsUrl: "https://vs-hls-push-uk.live.fastly.md.bbci.co.uk/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/iptv_hd_abr_v1.m3u8" },
  { id: "trt-haber", name: "TRT Haber", region: "europe", color: "#E30613", handle: "@trthaber", fallbackVideoId: "3XHebGJG0bc" },
  { id: "tagesschau24", name: "Tagesschau24", region: "europe", color: "#003366", handle: "@tagesschau", fallbackVideoId: "fC_q9TkO1uU", hlsUrl: "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8" },
  { id: "nhk-world", name: "NHK World", region: "asia", color: "#E60012", handle: "@NHKWORLDJAPAN", fallbackVideoId: "f0lYfG_vY_U", hlsUrl: "https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index_4M.m3u8" },
  { id: "cna-asia", name: "CNA", region: "asia", color: "#E4032E", handle: "@channelnewsasia", fallbackVideoId: "XWq5kBlakcQ" },
  { id: "india-today", name: "India Today", region: "asia", color: "#E32526", handle: "@indiatoday", fallbackVideoId: "sYZtOFzM78M", hlsUrl: "https://indiatodaylive.akamaized.net/hls/live/2014320/indiatoday/indiatodaylive/playlist.m3u8" },
  { id: "tbs-news", name: "TBS News", region: "asia", color: "#E60012", handle: "@tbsnewsdig", fallbackVideoId: "aUDm173E8k8" },
  { id: "abc-news-au", name: "ABC Australia", region: "asia", color: "#FFCC00", handle: "@abcnewsaustralia", fallbackVideoId: "vOTiJkg1voo", hlsUrl: "https://abc-iview-mediapackagestreams-2.akamaized.net/out/v1/6e1cc6d25ec0480ea099a5399d73bc4b/index.m3u8" },
  { id: "aljazeera", name: "Al Jazeera", region: "middle-east", color: "#FF8200", handle: "@AlJazeeraEnglish", fallbackVideoId: "gCNeDWCI0vo", hlsUrl: "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8" },
  { id: "alarabiya", name: "Al Arabiya", region: "middle-east", color: "#004B87", handle: "@AlArabiya", fallbackVideoId: "n7eQejkXbnM", hlsUrl: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8" },
  { id: "trt-world", name: "TRT World", region: "middle-east", color: "#E30613", handle: "@TRTWorld", fallbackVideoId: "ABfFhWzWs0s", hlsUrl: "https://tv-trtworld.medya.trt.com.tr/master.m3u8" },
  { id: "sky-arabia", name: "Sky Arabia", region: "middle-east", color: "#E60000", handle: "@skynewsarabia", fallbackVideoId: "U--OjmpjF5o", hlsUrl: "https://live-stream.skynewsarabia.com/c-horizontal-channel/horizontal-stream/index.m3u8" },
  { id: "kan-11", name: "Kan 11", region: "middle-east", color: "#0038A8", handle: "@KAN11NEWS", fallbackVideoId: "TCnaIE_SAtM", hlsUrl: "https://kan11.media.kan.org.il/hls/live/2024514/2024514/master.m3u8" },
  { id: "arise-news", name: "Arise News", region: "africa", color: "#B08D57", handle: "@AriseNewsChannel", fallbackVideoId: "4uHZdlX-DT4", hlsUrl: "https://liveedge-arisenews.visioncdn.com/live-hls/arisenews/arisenews/arisenews_web/master.m3u8" },
  { id: "ktn-news", name: "KTN News", region: "africa", color: "#ED1C24", handle: "@ktnnews_kenya", fallbackVideoId: "RmHtsdVb3mo" },
];

// Unchanged from the app's existing hardcoded list — same ids/videoIds, just
// now served from here instead of the proxied legacy fork.
const WEBCAM_FEEDS = [
  { id: "iran-tehran", city: "Tehran", country: "Iran", region: "iran", videoId: "-zGuR1qVKrU" },
  { id: "iran-telaviv", city: "Tel Aviv", country: "Israel", region: "iran", videoId: "gmtlJ_m2r5A" },
  { id: "iran-jerusalem", city: "Jerusalem", country: "Israel", region: "iran", videoId: "JHwwZRH2wz8" },
  { id: "iran-multicam", city: "Middle East", country: "Multi", region: "iran", videoId: "4E-iFtUM2kk" },
  { id: "jerusalem", city: "Jerusalem", country: "Israel", region: "middle-east", videoId: "UyduhBUpO7Q" },
  { id: "tehran", city: "Tehran", country: "Iran", region: "middle-east", videoId: "-zGuR1qVKrU" },
  { id: "tel-aviv", city: "Tel Aviv", country: "Israel", region: "middle-east", videoId: "gmtlJ_m2r5A" },
  { id: "mecca", city: "Mecca", country: "Saudi Arabia", region: "middle-east", videoId: "DEcpmPUbkDQ" },
  { id: "kyiv", city: "Kyiv", country: "Ukraine", region: "europe", videoId: "-Q7FuPINDjA" },
  { id: "odessa", city: "Odessa", country: "Ukraine", region: "europe", videoId: "e2gC37ILQmk" },
  { id: "paris", city: "Paris", country: "France", region: "europe", videoId: "OzYp4NRZlwQ" },
  { id: "st-petersburg", city: "St. Petersburg", country: "Russia", region: "europe", videoId: "CjtIYbmVfck" },
  { id: "london", city: "London", country: "UK", region: "europe", videoId: "Lxqcg1qt0XU" },
  { id: "washington", city: "Washington", country: "USA", region: "americas", videoId: "1wV9lLe14aU" },
  { id: "new-york", city: "New York", country: "USA", region: "americas", videoId: "4qyZLflp-sI" },
  { id: "los-angeles", city: "Los Angeles", country: "USA", region: "americas", videoId: "EO_1LWqsCNE" },
  { id: "miami", city: "Miami", country: "USA", region: "americas", videoId: "5YCajRjvWCg" },
  { id: "taipei", city: "Taipei", country: "Taiwan", region: "asia", videoId: "z_fY1pj1VBw" },
  { id: "shanghai", city: "Shanghai", country: "China", region: "asia", videoId: "76EwqI5XZIc" },
  { id: "tokyo", city: "Tokyo", country: "Japan", region: "asia", videoId: "4pu9sF5Qssw" },
  { id: "seoul", city: "Seoul", country: "South Korea", region: "asia", videoId: "-JhoMGoAfFc" },
  { id: "sydney", city: "Sydney", country: "Australia", region: "asia", videoId: "7pcL-0Wo77U" },
];

interface ResolvedChannel {
  id: string;
  name: string;
  region: string;
  color: string;
  hlsUrl: string | null;
  videoId: string | null;
}

// In-memory cache, survives across warm serverless invocations. Avoids
// re-scraping YouTube on every request for channels without an HLS stream.
const liveDetectCache = new Map<string, { videoId: string | null; expiresAt: number }>();
const LIVE_DETECT_TTL_MS = 5 * 60 * 1000;

async function detectLiveVideoId(handle: string): Promise<string | null> {
  try {
    const channelHandle = handle.startsWith("@") ? handle : `@${handle}`;
    const res = await fetch(`https://www.youtube.com/${channelHandle}/live`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const detailsIdx = html.indexOf('"videoDetails"');
    if (detailsIdx === -1) return null;
    const block = html.slice(detailsIdx, detailsIdx + 5000);
    const vidMatch = block.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const liveMatch = /"isLive"\s*:\s*true/.test(block);
    return vidMatch && liveMatch ? (vidMatch[1] ?? null) : null;
  } catch {
    return null;
  }
}

async function resolveChannel(def: NewsChannelDef): Promise<ResolvedChannel> {
  // YouTube takes precedence whenever a handle exists. hlsUrl is only used
  // for channels with no YouTube presence at all (upstream's HLS-only
  // channels, e.g. ctv-news/reuters-tv/gb-news — none of our 26 currently,
  // but keeping this order means adding one later just works).
  if (!def.handle) {
    return { id: def.id, name: def.name, region: def.region, color: def.color, hlsUrl: def.hlsUrl ?? null, videoId: null };
  }

  let videoId: string | null = null;
  const cached = liveDetectCache.get(def.id);
  if (cached && cached.expiresAt > Date.now()) {
    videoId = cached.videoId;
  } else {
    videoId = await detectLiveVideoId(def.handle);
    liveDetectCache.set(def.id, { videoId, expiresAt: Date.now() + LIVE_DETECT_TTL_MS });
  }

  return {
    id: def.id,
    name: def.name,
    region: def.region,
    color: def.color,
    hlsUrl: null,
    videoId: videoId ?? def.fallbackVideoId ?? null,
  };
}

export default async function handler(request: Request): Promise<Response> {
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
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const newsChannels = await Promise.all(NEWS_CHANNELS.map(resolveChannel));

  return new Response(JSON.stringify({ newsChannels, webcamFeeds: WEBCAM_FEEDS }), {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
