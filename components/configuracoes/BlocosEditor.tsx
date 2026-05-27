'use client';
import { useState, forwardRef, useImperativeHandle } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { BlocoArrastavel } from './blocos/BlocoArrastavel';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useImperativeHandle(ref, () => ({ getValue: () => blocos }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocos(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id);
        const newIndex = prev.findIndex(b => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function toggleEnabled(id: string) {
    setBlocos(prev => prev.map(b => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  }

  function toggleExpanded(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function updateData(id: string, data: BlocoItem['data']) {
    setBlocos(prev =>
      prev.map(b => (b.id === id ? ({ ...b, data } as BlocoItem) : b))
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocos.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocos.map(bloco => (
            <BlocoArrastavel
              key={bloco.id}
              id={bloco.id}
              title={bloco.label}
              enabled={bloco.enabled}
              expanded={expandedId === bloco.id}
              onToggleEnabled={() => toggleEnabled(bloco.id)}
              onToggleExpanded={() => toggleExpanded(bloco.id)}
            >
              {bloco.id === 'faixa' && (
                <FaixaBloco data={bloco.data} onChange={d => updateData(bloco.id, d)} />
              )}
              {bloco.id === 'banner' && (
                <BannerBloco data={bloco.data} onChange={d => updateData(bloco.id, d)} />
              )}
              {bloco.id === 'categorias' && (
                <CategoriasBloco data={bloco.data} onChange={d => updateData(bloco.id, d)} />
              )}
              {bloco.id === 'destaque' && (
                <DestaqueBloco data={bloco.data} onChange={d => updateData(bloco.id, d)} />
              )}
            </BlocoArrastavel>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
});
