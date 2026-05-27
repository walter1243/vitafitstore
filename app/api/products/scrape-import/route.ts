import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ScrapedProduct = {
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  stock: number;
  url: string;
  source: 'shopify' | 'woocommerce' | 'jsonld' | 'opengraph' | 'unknown';
};

async function tryShopify(origin: string): Promise<ScrapedProduct[] | null> {
  try {
    const res = await fetch(`${origin}/products.json?limit=250`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.products) || data.products.length === 0) return null;

    return data.products.map((p: any) => ({
      name: p.title ?? '',
      description: (p.body_html ?? '').replace(/<[^>]*>/g, '').trim(),
      price: parseFloat(p.variants?.[0]?.price ?? '0'),
      image: p.images?.[0]?.src ?? '',
      images: (p.images ?? []).slice(1).map((i: any) => i.src),
      stock: p.variants?.[0]?.inventory_quantity ?? 99,
      url: `${origin}/products/${p.handle}`,
      source: 'shopify' as const,
    }));
  } catch {
    return null;
  }
}

async function tryWooCommerce(origin: string): Promise<ScrapedProduct[] | null> {
  try {
    const res = await fetch(`${origin}/wp-json/wc/store/v1/products?per_page=100`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    return data.map((p: any) => ({
      name: p.name ?? '',
      description: (p.short_description ?? '').replace(/<[^>]*>/g, '').trim(),
      price: parseFloat(p.prices?.price ?? '0') / 100,
      image: p.images?.[0]?.src ?? '',
      images: (p.images ?? []).slice(1).map((i: any) => i.src),
      stock: p.stock_quantity ?? 99,
      url: p.permalink ?? origin,
      source: 'woocommerce' as const,
    }));
  } catch {
    return null;
  }
}

async function tryHtmlScrape(url: string): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return products;
    const html = await res.text();

    // JSON-LD (schema.org Product)
    const jsonLdRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    for (const match of html.matchAll(jsonLdRe)) {
      try {
        const raw = JSON.parse(match[1]);
        const items: any[] = Array.isArray(raw) ? raw : [raw];
        for (const item of items) {
          if (item['@type'] !== 'Product') continue;
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const imageArr: string[] = Array.isArray(item.image)
            ? item.image
            : item.image
            ? [item.image]
            : [];
          products.push({
            name: item.name ?? '',
            description: (item.description ?? '').replace(/<[^>]*>/g, '').trim(),
            price: parseFloat(offer?.price ?? '0'),
            image: imageArr[0] ?? '',
            images: imageArr.slice(1),
            stock: 99,
            url: item.url ?? url,
            source: 'jsonld',
          });
        }
      } catch {}
    }

    if (products.length > 0) return products;

    // Open Graph fallback (single product page)
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1]
      ?? html.match(/content="([^"]+)"\s+property="og:title"/)?.[1];
    const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]
      ?? html.match(/content="([^"]+)"\s+property="og:image"/)?.[1];
    const ogDesc = html.match(/property="og:description"\s+content="([^"]+)"/)?.[1]
      ?? html.match(/content="([^"]+)"\s+property="og:description"/)?.[1];
    const priceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>[\s\S]*?[\€\$\£R$]*\s*(\d+[,\.]\d{2})/i)?.[1];

    if (ogTitle) {
      products.push({
        name: ogTitle,
        description: ogDesc ?? '',
        price: parseFloat((priceMatch ?? '0').replace(',', '.')),
        image: ogImage ?? '',
        images: [],
        stock: 99,
        url,
        source: 'opengraph',
      });
    }
  } catch {}

  return products;
}

async function detectAndScrape(url: string): Promise<ScrapedProduct[]> {
  const origin = new URL(url).origin;

  const shopify = await tryShopify(origin);
  if (shopify) return shopify;

  const woo = await tryWooCommerce(origin);
  if (woo) return woo;

  return tryHtmlScrape(url);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, margin = 40 } = body as { url?: string; margin?: number };

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'URL deve usar HTTP ou HTTPS' }, { status: 400 });
    }

    const raw = await detectAndScrape(parsedUrl.href);

    if (raw.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Nenhum produto encontrado. Tente uma URL de listagem de produtos ou de produto individual.',
        products: [],
        count: 0,
      });
    }

    const products = raw.map(p => ({
      ...p,
      suggestedPrice: parseFloat((p.price * (1 + margin / 100)).toFixed(2)),
    }));

    const source = raw[0]?.source ?? 'unknown';
    const sourceLabel: Record<string, string> = {
      shopify: 'Shopify',
      woocommerce: 'WooCommerce',
      jsonld: 'JSON-LD (schema.org)',
      opengraph: 'Open Graph',
      unknown: 'Desconhecido',
    };

    return NextResponse.json({
      ok: true,
      source: sourceLabel[source] ?? source,
      count: products.length,
      margin,
      products,
    });
  } catch (err: any) {
    console.error('[POST /api/products/scrape-import]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao processar URL' }, { status: 500 });
  }
}
