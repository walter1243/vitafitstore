'use client';

import { useEffect, useMemo, useState } from 'react';
import { PackagePlus, Search, Trash2 } from 'lucide-react';

type ProductLite = {
  id: number;
  name: string;
  price: number;
  category?: string;
};

type KitItem = {
  productId: number;
  quantity: number;
  name: string;
  price: number;
};

type Kit = {
  id: number;
  baseProductId: number;
  baseProductName: string;
  baseProductPrice: number;
  finalPrice: number;
  items: KitItem[];
};

export function AdminKitsSection({ products }: { products: ProductLite[] }) {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [baseSearch, setBaseSearch] = useState('');
  const [baseProductId, setBaseProductId] = useState<number>(0);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [items, setItems] = useState<Array<{ productId: number; quantity: number }>>([]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [products],
  );

  const filteredBaseProducts = useMemo(() => {
    const query = baseSearch.trim().toLowerCase();
    if (!query) return sortedProducts;
    return sortedProducts.filter((p) => p.name.toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query));
  }, [baseSearch, sortedProducts]);

  const filteredItemOptions = useMemo(() => {
    const blocked = new Set<number>([baseProductId, ...items.map((item) => item.productId)]);
    const query = itemSearch.trim().toLowerCase();
    return sortedProducts.filter((p) => {
      if (blocked.has(p.id)) return false;
      if (!query) return true;
      return p.name.toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query);
    });
  }, [baseProductId, itemSearch, items, sortedProducts]);

  async function loadKits() {
    try {
      setLoading(true);
      const res = await fetch('/api/product-kits', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar kits.');
      setKits(Array.isArray(data?.kits) ? data.kits : []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao carregar kits.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKits();
  }, []);

  function resetForm() {
    setBaseSearch('');
    setBaseProductId(0);
    setItemSearch('');
    setSelectedProductId(0);
    setItems([]);
  }

  function addItem(productId: number) {
    if (!productId || productId === baseProductId) return;
    setItems((prev) => [...prev, { productId, quantity: 1 }]);
    setSelectedProductId(0);
    setItemSearch('');
  }

  function updateQuantity(productId: number, quantity: number) {
    setItems((prev) => prev.map((item) => (
      item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    )));
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function saveKit() {
    setMessage(null);
    if (!baseProductId) {
      setMessage({ type: 'error', text: 'Selecione o produto principal do kit.' });
      return;
    }

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Adicione ao menos um produto complementar.' });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/product-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseProductId, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao salvar kit.');
      setMessage({ type: 'success', text: 'Kit salvo com sucesso.' });
      await loadKits();
      resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao salvar kit.' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteKit(productId: number) {
    if (!window.confirm('Deseja remover este kit?')) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/product-kits?baseProductId=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao remover kit.');
      setMessage({ type: 'success', text: 'Kit removido com sucesso.' });
      await loadKits();
      if (baseProductId === productId) resetForm();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao remover kit.' });
    }
  }

  function editKit(kit: Kit) {
    setBaseProductId(kit.baseProductId);
    setItems(kit.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    setMessage(null);
  }

  const selectedBaseProduct = sortedProducts.find((p) => p.id === baseProductId);

  return (
    <div className="space-y-4 p-5">
      <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
        <div className="mb-4 flex items-center gap-2">
          <PackagePlus size={16} className="text-green-500" />
          <h3 className="text-sm font-semibold text-white">Configurar kit por produto</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/55">Buscar produto principal</label>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={baseSearch}
                onChange={(e) => setBaseSearch(e.target.value)}
                placeholder="Nome ou categoria"
                className="w-full rounded-xl border border-white/10 bg-[#22263a] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
              />
            </div>
            <select
              value={baseProductId || ''}
              onChange={(e) => setBaseProductId(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
            >
              <option value="">Selecione o produto principal</option>
              {filteredBaseProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - €{Number(p.price || 0).toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/55">Buscar produto complementar</label>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Nome ou categoria"
                className="w-full rounded-xl border border-white/10 bg-[#22263a] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <select
                value={selectedProductId || ''}
                onChange={(e) => setSelectedProductId(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
              >
                <option value="">Selecione para adicionar</option>
                {filteredItemOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - €{Number(p.price || 0).toFixed(2)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addItem(selectedProductId)}
                disabled={!selectedProductId || !baseProductId}
                className="rounded-xl bg-green-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/45">
              Nenhum produto complementar adicionado.
            </div>
          )}
          {items.map((item) => {
            const product = sortedProducts.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{product.name}</div>
                  <div className="text-xs text-white/50">€{Number(product.price || 0).toFixed(2)} cada</div>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, Number(e.target.value || 1))}
                  className="w-20 rounded-lg border border-white/10 bg-[#22263a] px-2 py-1.5 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"
                  title="Remover item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/55">
            {selectedBaseProduct ? `Produto principal: ${selectedBaseProduct.name}` : 'Selecione o produto principal.'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/5"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={saveKit}
              disabled={saving || !baseProductId || items.length === 0}
              className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar kit'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f1117] p-4">
        <h4 className="text-sm font-semibold text-white">Kits cadastrados</h4>

        {loading ? (
          <div className="mt-3 text-xs text-white/50">Carregando kits...</div>
        ) : kits.length === 0 ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/45">
            Ainda não existem kits cadastrados.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {kits.map((kit) => (
              <div key={kit.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{kit.baseProductName}</div>
                    <div className="mt-1 text-xs text-white/55">
                      Preço base: €{Number(kit.baseProductPrice || 0).toFixed(2)} · Preço final kit: €{Number(kit.finalPrice || 0).toFixed(2)}
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      {kit.items.map((item) => `${item.quantity}x ${item.name}`).join(' + ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editKit(kit)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/5"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteKit(kit.baseProductId)}
                      className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
