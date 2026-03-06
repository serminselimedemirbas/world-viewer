/**
 * GET /api/youtube/sources
 *
 * Returns the current video IDs for all news channels and webcam feeds.
 * Video IDs can be updated server-side without requiring an app update.
 * Cached aggressively — s-maxage=3600, stale-while-revalidate=300.
 */

export const config = { runtime: 'edge' };

import { getCorsHeaders, isDisallowedOrigin } from '../_cors.js';
// @ts-expect-error — JS module
import { validateApiKey } from '../_api-key.js';

// ---------------------------------------------------------------------------
// Source data — update videoId values here to push new stream IDs to all clients
// ---------------------------------------------------------------------------

const NEWS_CHANNELS = [
  // Americas
  { id: 'bloomberg',    name: 'Bloomberg',    region: 'americas',    videoId: 'iEpJwprxDdk' },
  { id: 'cnbc',         name: 'CNBC',         region: 'americas',    videoId: '9NyxcX3rhQs' },
  { id: 'cnn',          name: 'CNN',          region: 'americas',    videoId: 'w_Ma8oQLmSM' },
  { id: 'fox-news',     name: 'Fox News',     region: 'americas',    videoId: 'QaftgYkG-ek' },
  { id: 'cbs-news',     name: 'CBS News',     region: 'americas',    videoId: 'R9L8sDK8iEc' },
  { id: 'nbc-news',     name: 'NBC News',     region: 'americas',    videoId: 'yMr0neQhu6c' },
  { id: 'cbc-news',     name: 'CBC News',     region: 'americas',    videoId: 'jxP_h3V-Dv8' },
  // Europe
  { id: 'sky',          name: 'Sky News',     region: 'europe',      videoId: 'uvviIF4725I' },
  { id: 'euronews',     name: 'Euronews',     region: 'europe',      videoId: 'pykpO5kQJ98' },
  { id: 'dw',           name: 'DW',           region: 'europe',      videoId: 'LuKwFajn37U' },
  { id: 'france24',     name: 'France 24',    region: 'europe',      videoId: 'u9foWyMSETk' },
  { id: 'bbc-news',     name: 'BBC News',     region: 'europe',      videoId: 'bjgQzJzCZKs' },
  { id: 'trt-haber',    name: 'TRT Haber',    region: 'europe',      videoId: '3XHebGJG0bc' },
  { id: 'tagesschau24', name: 'Tagesschau24', region: 'europe',      videoId: 'fC_q9TkO1uU' },
  // Asia
  { id: 'nhk-world',    name: 'NHK World',    region: 'asia',        videoId: 'f0lYfG_vY_U' },
  { id: 'cna-asia',     name: 'CNA',          region: 'asia',        videoId: 'XWq5kBlakcQ' },
  { id: 'india-today',  name: 'India Today',  region: 'asia',        videoId: 'sYZtOFzM78M' },
  { id: 'tbs-news',     name: 'TBS News',     region: 'asia',        videoId: 'aUDm173E8k8' },
  { id: 'abc-news-au',  name: 'ABC Australia',region: 'asia',        videoId: 'vOTiJkg1voo' },
  // Middle East
  { id: 'aljazeera',    name: 'Al Jazeera',   region: 'middle-east', videoId: 'gCNeDWCI0vo' },
  { id: 'alarabiya',    name: 'Al Arabiya',   region: 'middle-east', videoId: 'n7eQejkXbnM' },
  { id: 'trt-world',    name: 'TRT World',    region: 'middle-east', videoId: 'ABfFhWzWs0s' },
  { id: 'sky-arabia',   name: 'Sky Arabia',   region: 'middle-east', videoId: 'U--OjmpjF5o' },
  { id: 'kan-11',       name: 'Kan 11',       region: 'middle-east', videoId: 'TCnaIE_SAtM' },
  // Africa
  { id: 'arise-news',   name: 'Arise News',   region: 'africa',      videoId: '4uHZdlX-DT4' },
  { id: 'ktn-news',     name: 'KTN News',     region: 'africa',      videoId: 'RmHtsdVb3mo' },
];

const WEBCAM_FEEDS = [
  // Iran Attacks
  { id: 'iran-tehran',    city: 'Tehran',      country: 'Iran',         region: 'iran',        videoId: '-zGuR1qVKrU' },
  { id: 'iran-telaviv',   city: 'Tel Aviv',    country: 'Israel',       region: 'iran',        videoId: 'gmtlJ_m2r5A' },
  { id: 'iran-jerusalem', city: 'Jerusalem',   country: 'Israel',       region: 'iran',        videoId: 'JHwwZRH2wz8' },
  { id: 'iran-multicam',  city: 'Middle East', country: 'Multi',        region: 'iran',        videoId: '4E-iFtUM2kk' },
  // Middle East
  { id: 'jerusalem',      city: 'Jerusalem',   country: 'Israel',       region: 'middle-east', videoId: 'UyduhBUpO7Q' },
  { id: 'tehran',         city: 'Tehran',      country: 'Iran',         region: 'middle-east', videoId: '-zGuR1qVKrU' },
  { id: 'tel-aviv',       city: 'Tel Aviv',    country: 'Israel',       region: 'middle-east', videoId: 'gmtlJ_m2r5A' },
  { id: 'mecca',          city: 'Mecca',       country: 'Saudi Arabia', region: 'middle-east', videoId: 'DEcpmPUbkDQ' },
  // Europe
  { id: 'kyiv',           city: 'Kyiv',        country: 'Ukraine',      region: 'europe',      videoId: '-Q7FuPINDjA' },
  { id: 'odessa',         city: 'Odessa',      country: 'Ukraine',      region: 'europe',      videoId: 'e2gC37ILQmk' },
  { id: 'paris',          city: 'Paris',       country: 'France',       region: 'europe',      videoId: 'OzYp4NRZlwQ' },
  { id: 'st-petersburg',  city: 'St. Petersburg', country: 'Russia',   region: 'europe',      videoId: 'CjtIYbmVfck' },
  { id: 'london',         city: 'London',      country: 'UK',           region: 'europe',      videoId: 'Lxqcg1qt0XU' },
  // Americas
  { id: 'washington',     city: 'Washington',  country: 'USA',          region: 'americas',    videoId: '1wV9lLe14aU' },
  { id: 'new-york',       city: 'New York',    country: 'USA',          region: 'americas',    videoId: '4qyZLflp-sI' },
  { id: 'los-angeles',    city: 'Los Angeles', country: 'USA',          region: 'americas',    videoId: 'EO_1LWqsCNE' },
  { id: 'miami',          city: 'Miami',       country: 'USA',          region: 'americas',    videoId: '5YCajRjvWCg' },
  // Asia
  { id: 'taipei',         city: 'Taipei',      country: 'Taiwan',       region: 'asia',        videoId: 'z_fY1pj1VBw' },
  { id: 'shanghai',       city: 'Shanghai',    country: 'China',        region: 'asia',        videoId: '76EwqI5XZIc' },
  { id: 'tokyo',          city: 'Tokyo',       country: 'Japan',        region: 'asia',        videoId: '4pu9sF5Qssw' },
  { id: 'seoul',          city: 'Seoul',       country: 'South Korea',  region: 'asia',        videoId: '-JhoMGoAfFc' },
  { id: 'sydney',         city: 'Sydney',      country: 'Australia',    region: 'asia',        videoId: '7pcL-0Wo77U' },
];

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

  const body = JSON.stringify({ newsChannels: NEWS_CHANNELS, webcamFeeds: WEBCAM_FEEDS });

  return new Response(body, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300, stale-if-error=86400',
    },
  });
}
