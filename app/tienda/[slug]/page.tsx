import { permanentRedirect } from 'next/navigation';
import { normalizeSlug } from '@/lib/sales-pages-shared';

// Endereço antigo das lojas: agora cada loja tem o link curto /<slug>
// (ver app/[slug]/page.tsx). Mantido só para não quebrar links já divulgados.
type PageProps = { params: Promise<{ slug: string }> };

export default async function OldStoreLink({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/${normalizeSlug(slug)}`);
}
