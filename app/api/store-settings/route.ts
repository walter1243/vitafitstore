import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const DEFAULT_SETTINGS = {
  storeName: "VitaFit Store",
  logoUrl: "",
  themeColor: "#10b981",
  instagram: "",
  facebook: "",
};

export async function GET() {
  try {
    const [row] = await sql`
      SELECT store_name AS "storeName", logo_url AS "logoUrl", theme_color AS "themeColor",
             instagram, facebook
      FROM store_settings
      ORDER BY id ASC
      LIMIT 1
    `;

    return NextResponse.json(row ?? DEFAULT_SETTINGS);
  } catch (err: any) {
    console.error("[GET /api/store-settings]", err);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const storeName = String(body.storeName ?? DEFAULT_SETTINGS.storeName).trim() || DEFAULT_SETTINGS.storeName;
    const logoUrl = String(body.logoUrl ?? "").trim();
    const themeColor = String(body.themeColor ?? DEFAULT_SETTINGS.themeColor).trim() || DEFAULT_SETTINGS.themeColor;
    const instagram = String(body.instagram ?? "").trim();
    const facebook = String(body.facebook ?? "").trim();

    await sql`
      INSERT INTO store_settings (id, store_name, logo_url, theme_color, instagram, facebook)
      VALUES (1, ${storeName}, ${logoUrl || null}, ${themeColor}, ${instagram || null}, ${facebook || null})
      ON CONFLICT (id)
      DO UPDATE SET
        store_name = EXCLUDED.store_name,
        logo_url = EXCLUDED.logo_url,
        theme_color = EXCLUDED.theme_color,
        instagram = EXCLUDED.instagram,
        facebook = EXCLUDED.facebook
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/store-settings]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao salvar configurações." }, { status: 500 });
  }
}
