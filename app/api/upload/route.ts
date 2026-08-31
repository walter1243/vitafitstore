import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getAdminSessionFromRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// Client-side direct upload to Vercel Blob: the browser sends the file
// bytes straight to blob storage, never through this serverless function's
// body — that's what lets large videos (which blow past Vercel's ~4.5MB
// request body limit) actually get saved instead of failing to publish.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const session = getAdminSessionFromRequest(req);
        if (!session) {
          throw new Error('Sessão inválida. Faça login novamente.');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'],
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No DB bookkeeping needed — the returned URL is stored directly
        // in the site content field by the caller.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err: any) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: err?.message ?? 'Erro ao enviar arquivo.' }, { status: 400 });
  }
}
