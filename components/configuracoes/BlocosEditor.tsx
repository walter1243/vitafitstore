'use client';
import { useState, forwardRef, useImperativeHandle } from 'react';
import { Pencil, X } from 'lucide-react';
import { FaixaBloco, type FaixaData } from './blocos/FaixaBloco';
import { BannerBloco, type BannerData } from './blocos/BannerBloco';
import { CategoriasBloco, type CategoriasData } from './blocos/CategoriasBloco';
import { DestaqueBloco, type DestaqueData } from './blocos/DestaqueBloco';

// ─── Types ────────────────────────────────────────────────────────────────────

type BlocoItem =
  | { id: 'faixa'; label: string; enabled: boolean; data: FaixaData }
  | { id: 'banner'; label: string; enabled: boolean; data: BannerData }
  | { id: 'categorias'; label: string; enabled: boolean; data: CategoriasData }
  | { id: 'destaque'; label: string; enabled: boolean; data: DestaqueData };

export type BlocosEditorHandle = { getValue: () => BlocoItem[] };

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BLOCOS: BlocoItem[] = [
  {
    id: 'faixa',
    label: 'Faixa de Aviso',
    enabled: true,
    data: {
      text: 'Frete grátis em pedidos acima de €50',
      bgColor: '#10b981',
      textColor: '#ffffff',
      animated: true,
    },
  },
  {
    id: 'banner',
    label: 'Banner Principal',
    enabled: true,
    data: { bannerType: 'image', imageUrl: '', videoUrl: '', carouselItems: [] },
  },
  {
    id: 'categorias',
    label: 'Categorias',
    enabled: true,
    data: { title: 'Nossas Categorias', categories: [], layout: 'grid', style: 'card' },
  },
  {
    id: 'destaque',
    label: 'Produtos em Destaque',
    enabled: true,
    data: {
      title: 'Produtos em Destaque',
      quantity: 8,
      criteria: 'mais-vendidos',
      mobileColumns: 2,
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const BlocosEditor = forwardRef<BlocosEditorHandle>(function BlocosEditor(_, ref) {
  const [blocos, setBlocos] = useState<BlocoItem[]>(DEFAULT_BLOCOS);
  const [editingId, setEditingId] = useState<BlocoItem['id'] | null>(null);

  useImperativeHandle(ref, () => ({ getValue: () => blocos }));

  function toggleEnabled(id: string) {
    setBlocos(prev => prev.map(b => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  }

  function updateData(id: string, data: BlocoItem['data']) {
    setBlocos(prev =>
      prev.map(b => (b.id === id ? ({ ...b, data } as BlocoItem) : b))
    );
  }

  const editingBlock = blocos.find(b => b.id === editingId) ?? null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {blocos.map((bloco) => (
          <div key={bloco.id} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{bloco.label}</h3>
                <p className="mt-1 text-xs text-white/50">
                  {bloco.id === 'banner' && 'Banner principal da vitrine'}
                  {bloco.id === 'faixa' && 'Faixa de aviso no topo da loja'}
                  {bloco.id === 'categorias' && 'Sessão de categorias em destaque'}
                  {bloco.id === 'destaque' && 'Bloco de produtos em evidência'}
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={bloco.enabled}
                  onChange={() => toggleEnabled(bloco.id)}
                  className="h-4 w-4 rounded border-white/20 accent-green-500"
                />
                Ativo
              </label>
            </div>

            {bloco.id === 'banner' && (
              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                Resolução recomendada do banner: 1920 x 820 px (desktop) e 1080 x 1350 px (mobile).
              </div>
            )}

            <button
              type="button"
              onClick={() => setEditingId(bloco.id)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              <Pencil size={12} /> Editar tópico
            </button>
          </div>
        ))}
      </div>

      {editingBlock && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4" onClick={() => setEditingId(null)}>
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#1a1d27] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Editar: {editingBlock.label}</h3>
                {editingBlock.id === 'banner' && (
                  <p className="mt-1 text-xs text-emerald-300">Área útil sugerida: 1920x820 (desktop) / 1080x1350 (mobile).</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </div>

            {editingBlock.id === 'faixa' && (
              <FaixaBloco data={editingBlock.data} onChange={(d) => updateData(editingBlock.id, d)} />
            )}
            {editingBlock.id === 'banner' && (
              <BannerBloco data={editingBlock.data} onChange={(d) => updateData(editingBlock.id, d)} />
            )}
            {editingBlock.id === 'categorias' && (
              <CategoriasBloco data={editingBlock.data} onChange={(d) => updateData(editingBlock.id, d)} />
            )}
            {editingBlock.id === 'destaque' && (
              <DestaqueBloco data={editingBlock.data} onChange={(d) => updateData(editingBlock.id, d)} />
            )}
          </div>
        </div>
      )}
    </>
  );
});
