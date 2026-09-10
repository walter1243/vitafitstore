import { sql } from '@/lib/db';

// CJ Dropshipping API v2.0 client — https://developers.cjdropshipping.com/api2.0/v1
//
// Auth flow: the API key from CJ_API_KEY is exchanged for a short-lived
// accessToken (~15 days) + longer-lived refreshToken (~180 days). Both are
// persisted in the cj_tokens table (not memory) because serverless
// functions don't share memory between invocations. getAccessToken itself
// is rate-limited by CJ to once per 5 minutes, so we must cache the result
// rather than calling it on every request.

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

// CJ prices are returned in USD; the store displays everything in EUR.
// This is a static approximation, not a live rate — the admin always
// reviews/edits the price before a product is actually saved, so this only
// needs to be in the right ballpark. Update this constant if it drifts.
export const CJ_USD_TO_EUR = 0.92;

type CjTokenRow = {
  access_token: string;
  access_token_expiry: string;
  refresh_token: string;
  refresh_token_expiry: string;
};

async function ensureCjTokensTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS cj_tokens (
      id SERIAL PRIMARY KEY,
      access_token TEXT,
      access_token_expiry TIMESTAMPTZ,
      refresh_token TEXT,
      refresh_token_expiry TIMESTAMPTZ,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

async function saveCjTokens(data: {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
}) {
  await ensureCjTokensTable();
  await sql`DELETE FROM cj_tokens`;
  await sql`
    INSERT INTO cj_tokens (id, access_token, access_token_expiry, refresh_token, refresh_token_expiry)
    VALUES (1, ${data.accessToken}, ${data.accessTokenExpiryDate}, ${data.refreshToken}, ${data.refreshTokenExpiryDate})
  `;
}

async function getStoredCjTokens(): Promise<CjTokenRow | null> {
  await ensureCjTokensTable();
  const [row] = await sql`SELECT * FROM cj_tokens WHERE id = 1 LIMIT 1`;
  return (row as CjTokenRow) ?? null;
}

class CjApiError extends Error {}

async function cjPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.result) {
    throw new CjApiError(data?.message || `Erro na API da CJ (${res.status})`);
  }
  return data.data;
}

async function requestFreshTokenFromApiKey() {
  // Accept either name — CJ_API_KEY is the documented one, CJ_KEY is a
  // shorter alias some environments end up using instead.
  const apiKey = process.env.CJ_API_KEY || process.env.CJ_KEY;
  if (!apiKey) {
    throw new CjApiError('CJ_API_KEY (ou CJ_KEY) não configurada no ambiente.');
  }
  const data = await cjPost('/authentication/getAccessToken', { apiKey });
  await saveCjTokens(data);
  return data.accessToken as string;
}

async function refreshToken(refreshTokenValue: string) {
  const data = await cjPost('/authentication/refreshAccessToken', { refreshToken: refreshTokenValue });
  await saveCjTokens(data);
  return data.accessToken as string;
}

// Buffer so we never hand out a token that expires mid-request.
const EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000;

export async function getValidCjAccessToken(): Promise<string> {
  const stored = await getStoredCjTokens();

  if (stored?.access_token && new Date(stored.access_token_expiry).getTime() - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
    return stored.access_token;
  }

  if (stored?.refresh_token && new Date(stored.refresh_token_expiry).getTime() - EXPIRY_SAFETY_MARGIN_MS > Date.now()) {
    return refreshToken(stored.refresh_token);
  }

  return requestFreshTokenFromApiKey();
}

async function cjGet(path: string, query: Record<string, string | number | undefined>) {
  const token = await getValidCjAccessToken();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${BASE_URL}${path}?${qs.toString()}`, {
    headers: { 'CJ-Access-Token': token },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.result) {
    throw new CjApiError(data?.message || `Erro na API da CJ (${res.status})`);
  }
  return data.data;
}

// CJ sometimes returns a price as a range string for products with
// variants (e.g. "6.77-24.10") instead of a plain number — Number() on
// that yields NaN, which JSON.stringify silently turns into null,
// crashing any .toFixed() call on the client. Take the first numeric
// token found and always fall back to 0 rather than NaN.
function parseCjPrice(raw: unknown): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const match = String(raw ?? '').match(/[\d.]+/);
  const value = match ? Number(match[0]) : 0;
  return Number.isFinite(value) ? value : 0;
}

export type CjSearchResult = {
  pid: string;
  name: string;
  image: string;
  priceUsd: number;
  categoryName: string;
};

export async function searchCjProducts(opts: { keyword?: string; page?: number; size?: number }): Promise<CjSearchResult[]> {
  const data = await cjGet('/product/listV2', {
    keyWord: opts.keyword,
    page: opts.page ?? 1,
    size: opts.size ?? 20,
  });
  // The real response nests results one level deeper than the public docs
  // show: data.content is a 1-item array wrapping { productList, keyWord, ... },
  // not the product array itself — confirmed against the live API.
  const productList: any[] = data?.content?.[0]?.productList ?? [];
  return productList.map((item) => ({
    pid: String(item.id),
    name: String(item.nameEn ?? ''),
    image: String(item.bigImage ?? ''),
    priceUsd: parseCjPrice(item.sellPrice ?? item.nowPrice),
    categoryName: String(item.threeCategoryName ?? ''),
  }));
}

export type CjProductDetail = {
  pid: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  priceUsd: number;
};

function stripCjDescriptionStyles(html: string) {
  // CJ descriptions come as raw HTML pulled from their own product pages,
  // often with inline widths/positioning meant for their layout, not ours.
  return String(html || '').replace(/style="[^"]*"/gi, '').replace(/width="[^"]*"/gi, '');
}

export async function getCjProductDetail(pid: string): Promise<CjProductDetail> {
  const data = await cjGet('/product/query', { pid });
  const images: string[] = Array.isArray(data?.productImageSet) ? data.productImageSet : [];
  return {
    pid: String(data.pid ?? pid),
    name: String(data.productNameEn ?? ''),
    description: stripCjDescriptionStyles(data.description ?? ''),
    image: String(data.bigImage ?? images[0] ?? ''),
    images: images.filter(Boolean),
    priceUsd: parseCjPrice(data.sellPrice),
  };
}
