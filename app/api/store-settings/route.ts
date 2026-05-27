import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const DEFAULT_SETTINGS = {
  storeName: "VitaFit Store",
  logoUrl: "",
  themeColor: "#10b981",
  instagram: "",
  whatsapp: "+34 601 678 657",
  whatsappFloatingEnabled: true,
  whatsappGreeting: "Hola! Bienvenido a VitaFit Store. En que puedo ayudarte hoy?",
  whatsappOrderTemplate:
    "Hola {name}! Gracias por tu compra en VitaFit. Tu pedido #{orderId} esta confirmado y ya estamos preparando {productName}. {eta}",
  whatsappTrackingTemplate:
    "Hola {name}! Buenas noticias: tu pedido #{orderId} ya fue enviado. Transportista: {carrier}. Codigo: {trackingCode}. Rastreo: {trackingUrl}",
  whatsappFutureTemplate:
    "Hola {name}! Este es un mensaje futuro editable para nuevas automatizaciones.",
};

async function ensureStoreSettingsColumns() {
  await sql`
    ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS whatsapp TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_floating_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS whatsapp_greeting TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_order_template TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_tracking_template TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_future_template TEXT
  `;
}

export async function GET() {
  try {
    await ensureStoreSettingsColumns();
    const [row] = await sql`
      SELECT store_name AS "storeName", logo_url AS "logoUrl", theme_color AS "themeColor",
             instagram,
             whatsapp,
             COALESCE(whatsapp_floating_enabled, TRUE) AS "whatsappFloatingEnabled",
             COALESCE(whatsapp_greeting, ${DEFAULT_SETTINGS.whatsappGreeting}) AS "whatsappGreeting",
             COALESCE(whatsapp_order_template, ${DEFAULT_SETTINGS.whatsappOrderTemplate}) AS "whatsappOrderTemplate",
             COALESCE(whatsapp_tracking_template, ${DEFAULT_SETTINGS.whatsappTrackingTemplate}) AS "whatsappTrackingTemplate",
             COALESCE(whatsapp_future_template, ${DEFAULT_SETTINGS.whatsappFutureTemplate}) AS "whatsappFutureTemplate"
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
    await ensureStoreSettingsColumns();
    const body = await req.json();
    const storeName = String(body.storeName ?? DEFAULT_SETTINGS.storeName).trim() || DEFAULT_SETTINGS.storeName;
    const logoUrl = String(body.logoUrl ?? "").trim();
    const themeColor = String(body.themeColor ?? DEFAULT_SETTINGS.themeColor).trim() || DEFAULT_SETTINGS.themeColor;
    const instagram = String(body.instagram ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const whatsappFloatingEnabled = Boolean(body.whatsappFloatingEnabled ?? DEFAULT_SETTINGS.whatsappFloatingEnabled);
    const whatsappGreeting = String(body.whatsappGreeting ?? DEFAULT_SETTINGS.whatsappGreeting).trim() || DEFAULT_SETTINGS.whatsappGreeting;
    const whatsappOrderTemplate = String(body.whatsappOrderTemplate ?? DEFAULT_SETTINGS.whatsappOrderTemplate).trim() || DEFAULT_SETTINGS.whatsappOrderTemplate;
    const whatsappTrackingTemplate = String(body.whatsappTrackingTemplate ?? DEFAULT_SETTINGS.whatsappTrackingTemplate).trim() || DEFAULT_SETTINGS.whatsappTrackingTemplate;
    const whatsappFutureTemplate = String(body.whatsappFutureTemplate ?? DEFAULT_SETTINGS.whatsappFutureTemplate).trim() || DEFAULT_SETTINGS.whatsappFutureTemplate;

    await sql`
      INSERT INTO store_settings (
        id,
        store_name,
        logo_url,
        theme_color,
        instagram,
        whatsapp,
        whatsapp_floating_enabled,
        whatsapp_greeting,
        whatsapp_order_template,
        whatsapp_tracking_template,
        whatsapp_future_template
      )
      VALUES (
        1,
        ${storeName},
        ${logoUrl || null},
        ${themeColor},
        ${instagram || null},
        ${whatsapp || null},
        ${whatsappFloatingEnabled},
        ${whatsappGreeting},
        ${whatsappOrderTemplate},
        ${whatsappTrackingTemplate},
        ${whatsappFutureTemplate}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        store_name = EXCLUDED.store_name,
        logo_url = EXCLUDED.logo_url,
        theme_color = EXCLUDED.theme_color,
        instagram = EXCLUDED.instagram,
        whatsapp = EXCLUDED.whatsapp,
        whatsapp_floating_enabled = EXCLUDED.whatsapp_floating_enabled,
        whatsapp_greeting = EXCLUDED.whatsapp_greeting,
        whatsapp_order_template = EXCLUDED.whatsapp_order_template,
        whatsapp_tracking_template = EXCLUDED.whatsapp_tracking_template,
        whatsapp_future_template = EXCLUDED.whatsapp_future_template
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/store-settings]", err);
    return NextResponse.json({ error: err?.message ?? "Erro ao salvar configurações." }, { status: 500 });
  }
}
