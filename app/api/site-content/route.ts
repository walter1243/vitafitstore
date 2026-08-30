import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSiteContent, saveSiteSection } from "@/lib/site-content";
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_SECTIONS, type SiteContent } from "@/lib/site-content-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json(content, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (err: any) {
    console.error("[GET /api/site-content]", err);
    return NextResponse.json(DEFAULT_SITE_CONTENT, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const section = String(body?.section ?? "") as keyof SiteContent;
    if (!SITE_CONTENT_SECTIONS.includes(section)) {
      return NextResponse.json({ error: `Seção inválida: ${section}` }, { status: 400 });
    }
    if (!body?.data || typeof body.data !== "object") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    await saveSiteSection(section, body.data);

    return NextResponse.json({ success: true }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (err: any) {
    console.error("[POST /api/site-content]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao salvar conteúdo." }, { status: 500 });
  }
}
