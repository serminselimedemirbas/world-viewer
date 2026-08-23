/**
 * Shared helpers for the /api/v8/* static-reference endpoints.
 *
 * These endpoints are fork-specific: they serve the bundled reference
 * datasets (nuclear sites, pipelines, military bases, …) that the iOS app
 * overlays on the map. They live under a `v8` namespace deliberately —
 * upstream uses v1 (sebuf RPC) and v2 (shipping), so v8 is a version
 * number upstream will never reach into, keeping future upstream merges
 * conflict-free.
 *
 * Ported from the Next.js landing site (lib/api-v2/*), converted from
 * NextApiRequest/Response to the Web Request/Response the edge runtime
 * uses. Behaviour is unchanged: a module-load ETag over the static
 * payload, `public, max-age=3600, must-revalidate`, and a bare 304 when
 * If-None-Match matches.
 */

/**
 * Context the iOS client sends on every request, read from headers.
 * Not enforced (these endpoints are unauthenticated reference data) —
 * captured so it is available for logging/analytics without needing a
 * client release later.
 */
export interface ClientContext {
  language: string | null; // Accept-Language, e.g. "tr"
  locale: string | null; // X-Locale, e.g. "tr_TR"
  timezone: string | null; // X-Timezone, IANA name e.g. "Europe/Istanbul"
  rcUserId: string | null; // X-RC-User-Id, RevenueCat app user id
  appVersion: string | null; // X-App-Version
  platform: string | null; // X-Platform, e.g. "ios"
}

export function getClientContext(req: Request): ClientContext {
  const h = req.headers;
  return {
    language: h.get('accept-language'),
    locale: h.get('x-locale'),
    timezone: h.get('x-timezone'),
    rcUserId: h.get('x-rc-user-id'),
    appVersion: h.get('x-app-version'),
    platform: h.get('x-platform'),
  };
}

/**
 * Stable ETag for a JSON-serializable payload.
 *
 * Async because the edge runtime has no node:crypto — it uses Web Crypto,
 * whose digest is promise-based. Call it once per dataset at module load
 * and await the promise inside the handler (see `serveStatic`), so the
 * hash is computed once per isolate rather than per request.
 */
export async function makeEtag(data: unknown): Promise<string> {
  const body = new TextEncoder().encode(JSON.stringify(data));
  const digest = await crypto.subtle.digest('SHA-256', body);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `"${hex.slice(0, 32)}"`;
}

/**
 * GET-only handler for a static dataset: 405 on other methods, 304 when
 * the client's If-None-Match matches, otherwise the payload with
 * Cache-Control + ETag.
 */
export async function serveStatic(
  req: Request,
  data: unknown,
  etagPromise: Promise<string>,
  maxAgeSeconds = 3600,
): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  void getClientContext(req);

  const etag = await etagPromise;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${maxAgeSeconds}, must-revalidate`,
    ETag: etag,
  };

  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(JSON.stringify(data), { status: 200, headers });
}
