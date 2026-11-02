'use client';
import { useEffect, useState } from 'react';
import { Globe2, Loader2, Plus, Save, Trash2 } from 'lucide-react';

type Zone = {
  code: string;
  name: string;
  mode: 'packlink' | 'correos';
  priceLight: number | string;
  priceHeavy: number | string;
  freeOver: number | string | null;
  embedPct: number | string;
  enabled: boolean;
};

// Igual a lib/country-price: acrescimo por unidade e o frete que sobra.
const surchargeOf = (z: Zone) => (z.code === 'ES' ? 0 : Math.ceil((Number(z.embedPct) || 0) / 100 * (Number(z.priceLight) || 0)));

const INPUT = 'w-full rounded-lg border border-white/10 bg-[#1c2236] px-2.5 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

// Admin → Envio por país: para onde a loja vende e quanto cobra.
// Packlink = frete calculado na hora (com a tabela como reserva se ela
// falhar); Correos = preco fixo da tabela, despacho manual nos Correos.
export function ShippingZonesSection({ notify }: { notify: (type: 'success' | 'error', msg: string) => void }) {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/shipping/zones?all=1').then((r) => r.json()).then((d) => setZones(Array.isArray(d?.zones) ? d.zones : [])).catch(() => setZones([]));
  }, []);

  const set = (i: number, patch: Partial<Zone>) => { setZones((z) => z && z.map((x, k) => (k === i ? { ...x, ...patch } : x))); setDirty(true); };

  function add() {
    const code = newCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    if (code.length !== 2 || !newName.trim()) { notify('error', 'Informe o código de 2 letras (ex.: SE) e o nome do país.'); return; }
    if (zones?.some((z) => z.code === code)) { notify('error', `${code} já está na lista.`); return; }
    setZones((z) => [...(z ?? []), { code, name: newName.trim(), mode: 'correos', priceLight: 15, priceHeavy: 32, freeOver: null, embedPct: 60, enabled: true }]);
    setNewCode(''); setNewName(''); setDirty(true);
  }

  async function save() {
    if (!zones) return;
    setSaving(true);
    try {
      const res = await fetch('/api/shipping/zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: zones.map((z) => ({ ...z, freeOver: z.freeOver === '' ? null : z.freeOver })) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || 'Falha ao salvar.');
      setZones(d.zones);
      setDirty(false);
      notify('success', 'Envio por país salvo.');
    } catch (e: any) {
      notify('error', e?.message || 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!zones) return <p className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p>;

  return (
    <div className="space-y-5 text-white">
      <section className="rounded-2xl border border-white/10 bg-[#161b28] p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold"><Globe2 size={16} className="text-green-500" />Países e frete</h2>
        <ul className="mb-4 space-y-1 text-sm text-white/60">
          <li><strong className="text-white/80">Packlink</strong>: o frete é calculado na hora pela Packlink. Se ela não tiver envio para o endereço, o site usa os preços da tabela.</li>
          <li><strong className="text-white/80">Correos</strong>: preço fixo da tabela (você despacha nos Correos). O cliente só tem entrega a domicílio.</li>
          <li>Até 2 kg = Paquete Internacional Light. Acima de 2 kg = Estándar. O peso vem da caixa de envio de cada produto.</li>
          <li><strong className="text-white/80">% no produto</strong>: quem é desse país (pela localização ou pelo país escolhido no checkout) vê cada produto mais caro, e o frete cai o mesmo valor. Ex.: EUA €22 com 60% → produto +€14 e frete €8. Na Espanha não muda nada.</li>
        </ul>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="px-2 py-2 font-medium">Ativo</th>
                <th className="px-2 py-2 font-medium">País</th>
                <th className="px-2 py-2 font-medium">Como calcula</th>
                <th className="px-2 py-2 font-medium">Até 2 kg (€)</th>
                <th className="px-2 py-2 font-medium">Acima de 2 kg (€)</th>
                <th className="px-2 py-2 font-medium">Grátis a partir de (€)</th>
                <th className="px-2 py-2 font-medium">% no produto</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {zones.map((z, i) => (
                <tr key={z.code} className={z.enabled ? '' : 'opacity-50'}>
                  <td className="px-2 py-2">
                    <input type="checkbox" checked={z.enabled} onChange={(e) => set(i, { enabled: e.target.checked })} className="h-4 w-4 cursor-pointer accent-green-500" aria-label={`Vender para ${z.name}`} />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://flagcdn.com/w40/${z.code.toLowerCase()}.png`} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                      <input className={INPUT} value={z.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Nome do país" />
                      <span className="text-xs text-white/40">{z.code}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select className={INPUT} value={z.mode} onChange={(e) => set(i, { mode: e.target.value as Zone['mode'] })} aria-label="Como calcula">
                      <option value="packlink">Packlink</option>
                      <option value="correos">Correos (tabela)</option>
                    </select>
                  </td>
                  <td className="px-2 py-2"><input className={INPUT} type="number" min={0} step="0.01" value={z.priceLight} onChange={(e) => set(i, { priceLight: e.target.value })} aria-label="Preço até 2 kg" /></td>
                  <td className="px-2 py-2"><input className={INPUT} type="number" min={0} step="0.01" value={z.priceHeavy} onChange={(e) => set(i, { priceHeavy: e.target.value })} aria-label="Preço acima de 2 kg" /></td>
                  <td className="px-2 py-2"><input className={INPUT} type="number" min={0} step="0.01" placeholder="Nunca" value={z.freeOver ?? ''} onChange={(e) => set(i, { freeOver: e.target.value })} aria-label="Frete grátis a partir de" /></td>
                  <td className="px-2 py-2">
                    {z.code === 'ES' ? <span className="text-xs text-white/40">—</span> : (
                      <div>
                        <input className={INPUT} type="number" min={0} max={100} step="5" value={z.embedPct} onChange={(e) => set(i, { embedPct: e.target.value })} aria-label="Porcentagem do frete no produto" />
                        {surchargeOf(z) > 0 && <p className="mt-1 whitespace-nowrap text-[11px] text-green-400">+€{surchargeOf(z)} no produto · frete €{Math.max(0, (Number(z.priceLight) || 0) - surchargeOf(z)).toFixed(2)}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {z.code !== 'ES' && (
                      <button type="button" onClick={() => { setZones((l) => l && l.filter((_, k) => k !== i)); setDirty(true); }} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/50 hover:bg-red-500/10 hover:text-red-400" aria-label={`Remover ${z.name}`}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
          <label className="w-20 text-xs text-white/50">Código
            <input className={`${INPUT} mt-1 uppercase`} maxLength={2} placeholder="SE" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
          </label>
          <label className="min-w-[160px] flex-1 text-xs text-white/50">Nome do país (como o cliente vê)
            <input className={`${INPUT} mt-1`} placeholder="Suecia" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
          </label>
          <button type="button" onClick={add} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-white/10 px-4 text-sm font-medium hover:bg-white/15">
            <Plus size={15} /> Adicionar país
          </button>
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={save} disabled={saving || !dirty} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-bold shadow-lg hover:bg-green-700 disabled:cursor-default disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Salvando…' : dirty ? 'Salvar alterações' : 'Salvo'}
        </button>
      </div>
    </div>
  );
}
