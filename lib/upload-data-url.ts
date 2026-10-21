'use client';
import { upload } from '@vercel/blob/client';

// Fotos coladas/escolhidas no formulario ficam como "data:" (texto base64)
// pra aparecer na hora. Antes de salvar, sobem pro Vercel Blob e viram links
// curtos — sem isso o pedido passa do limite de ~4,5 MB da Vercel e da
// "Request Entity Too Large".
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm' };

const cache = new Map<string, string>();

export const isDataUrl = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:');

export async function dataUrlToBlobUrl(dataUrl: string, prefix = 'produtos'): Promise<string> {
  if (!isDataUrl(dataUrl)) return dataUrl;
  const hit = cache.get(dataUrl);
  if (hit) return hit;
  const blob = await (await fetch(dataUrl)).blob();
  const type = blob.type || 'image/png';
  if (!ALLOWED.includes(type)) throw new Error(`Formato de imagem não suportado (${type}). Use JPG, PNG, WebP ou AVIF.`);
  const res = await upload(`${prefix}/${Date.now()}.${EXT[type]}`, blob, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: type,
  });
  cache.set(dataUrl, res.url);
  return res.url;
}

// Troca todas as imagens "data:" de um HTML (descricao) por links.
export async function uploadInlineImages(html: string, prefix = 'produtos'): Promise<string> {
  if (!html || !html.includes('data:')) return html;
  const found = [...new Set(html.match(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi) ?? [])];
  let out = html;
  for (const d of found) out = out.split(d).join(await dataUrlToBlobUrl(d, prefix));
  return out;
}
