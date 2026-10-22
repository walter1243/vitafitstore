import { NextResponse } from 'next/server';

// Chave do Google Maps pro navegador (endereco do checkout). E uma chave de
// navegador, restrita no Google Cloud ao dominio kitoys3d.com — por isso pode
// ir pro cliente (como qualquer mapa do Google embutido num site).
export async function GET() {
  const key = process.env.KEY_Localizacaomaps || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
  return NextResponse.json({ key }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
