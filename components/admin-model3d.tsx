'use client';

// Produtos → "Modelo 3D (3MF do MakerWorld)". Recebe o arquivo da impressão
// (3MF do Bambu/MakerWorld, STL, OBJ ou GLB), monta o projeto inteiro em 3D,
// aplica o comprimento e a altura reais (escala UNIFORME, sem deformar),
// mostra a prévia e publica GLB + USDZ para a AR com tamanho travado.
// Só mexe na tabela product_models — preço, estoque e checkout não mudam.

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { ModelBox } from '@/components/ar/product-3d-viewer';
import { ACCEPTED_3D, buildForAr, extOf, loadModelFiles, type BuildResult, type LoadedMany, type UpAxis } from '@/lib/model3d-convert';
import {
  MAX_GLB_BYTES, TOLERANCE_BLOCK, WARN_GLB_BYTES, WARN_TRIANGLES, validateDims,
  type Placement, type ProductModel, type ValidationStatus,
} from '@/lib/product-models-shared';

const CARD = 'rounded-2xl border border-white/10 bg-[#0f1117] p-5';
const inputCls = 'w-full rounded-xl border border-white/10 bg-[#1c2236] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';
const STATUS: Record<ValidationStatus, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-white/10 text-white/70' },
  ok: { label: 'Validado', cls: 'bg-green-500/15 text-green-300' },
  alerta: { label: 'Com alerta', cls: 'bg-amber-400/15 text-amber-200' },
  bloqueado: { label: 'Bloqueado', cls: 'bg-red-500/15 text-red-300' },
};
const mm = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('pt-BR')} mm`;
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function AdminModel3D({ productId }: { productId: number | null }) {
  const [saved, setSaved] = useState<ProductModel | null>(null);
  const [files, setFiles] = useState<File[]>([]); // um 3MF pronto ou várias peças (STL) para unir
  const [loaded, setLoaded] = useState<LoadedMany | null>(null);
  const [built, setBuilt] = useState<BuildResult | null>(null);
  const [up, setUp] = useState<UpAxis>('z');
  const [rotY, setRotY] = useState(0);
  const [color, setColor] = useState('#d9d9d9');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [placement, setPlacement] = useState<Placement>('floor');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const lastPreview = useRef('');

  // modelo já salvo deste produto
  useEffect(() => {
    setSaved(null); setFiles([]); setLoaded(null); setBuilt(null); setMsg(null);
    if (!productId) return;
    fetch(`/api/product-models?productId=${productId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m: ProductModel | null) => {
        if (!m) return;
        setSaved(m);
        if (m.real) { setW(String(m.real.w)); setH(String(m.real.h)); }
        setPlacement(m.placement);
      })
      .catch(() => {});
  }, [productId]);

  // lê o arquivo (uma vez por arquivo/cor)
  useEffect(() => {
    if (!files.length) return;
    let on = true;
    setBusy('Lendo o arquivo 3D…'); setMsg(null); setBuilt(null);
    loadModelFiles(files, color)
      .then((L) => { if (!on) return; setLoaded(L); setUp(L.up); })
      .catch((e) => on && setMsg({ ok: false, text: e?.message || 'Não foi possível ler o arquivo.' }))
      .finally(() => on && setBusy(''));
    return () => { on = false; };
  }, [files, color]);

  // monta o modelo final (posição + medidas reais)
  const realW = Number(w.replace(',', '.')) || 0;
  const realH = Number(h.replace(',', '.')) || 0;
  const real = realW > 0 && realH > 0 ? { w: realW, h: realH } : null;
  useEffect(() => {
    if (!loaded) return;
    let on = true;
    const t = setTimeout(() => {
      setBusy('Montando o modelo…');
      buildForAr(loaded, { up, rotY, real: realW > 0 && realH > 0 ? { w: realW, h: realH } : null })
        .then((b) => {
          if (!on) { URL.revokeObjectURL(b.previewUrl); return; }
          if (lastPreview.current) URL.revokeObjectURL(lastPreview.current);
          lastPreview.current = b.previewUrl;
          setBuilt(b);
        })
        .catch((e) => on && setMsg({ ok: false, text: e?.message || 'Não foi possível montar o modelo.' }))
        .finally(() => on && setBusy(''));
    }, 350);
    return () => { on = false; clearTimeout(t); };
  }, [loaded, up, rotY, realW, realH]);
  useEffect(() => () => { if (lastPreview.current) URL.revokeObjectURL(lastPreview.current); }, []);

  if (!productId) {
    return (
      <section className={CARD}>
        <p className="text-sm font-semibold text-white">Modelo 3D e realidade aumentada (3MF)</p>
        <p className="mt-1 text-xs text-white/50">Cadastre o produto primeiro; depois, ao editar, envie o arquivo 3MF aqui.</p>
      </section>
    );
  }

  const report = built ? validateDims(real ? { ...real, d: 0 } : null, built.measured) : saved?.report ?? null;
  const proportionBad = Boolean(built && real && built.proportionDiffPct > TOLERANCE_BLOCK);
  const status: ValidationStatus = proportionBad ? 'bloqueado' : report?.status ?? 'pendente';
  const tooBig = Boolean(built && built.glb.byteLength > MAX_GLB_BYTES);
  const canPub = Boolean(built ? (status === 'ok' || status === 'alerta') && !tooBig : saved && (saved.validation === 'ok' || saved.validation === 'alerta'));
  const previewSrc = built?.previewUrl || saved?.glbUrl || '';
  const shown = built?.measured ?? saved?.measured ?? null;

  // um arquivo pronto (3MF) ou várias peças de uma vez (o site une tudo)
  const pick = (list: FileList | null | undefined) => {
    const all = Array.from(list ?? []);
    if (!all.length) return;
    const bad = all.find((f) => !['3mf', 'stl', 'obj', 'glb'].includes(extOf(f.name)));
    if (bad) { setMsg({ ok: false, text: `Formato não suportado (${bad.name}). Use 3MF, STL, OBJ ou GLB.` }); return; }
    if (all.length > 30) { setMsg({ ok: false, text: 'Máximo de 30 arquivos por modelo.' }); return; }
    setFiles(all);
  };

  async function save(arStatus: 'rascunho' | 'publicado') {
    if (!productId) return;
    setBusy(arStatus === 'publicado' ? 'Publicando…' : 'Salvando…'); setMsg(null);
    try {
      const body: Record<string, unknown> = { productId, real: real ? { ...real, d: 0 } : null, placement, arStatus };
      if (built && files.length) {
        const dir = `modelos3d/${productId}`;
        const clean = (n: string) => n.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40) || 'modelo';
        const base = clean(files[0].name);
        // originais guardados sem alteração (nunca sobrescreve: nome com sufixo aleatório)
        const originals = [];
        for (const f of files) originals.push(await upload(`${dir}/original-${clean(f.name)}.${extOf(f.name)}`, f, { access: 'public', handleUploadUrl: '/api/upload', contentType: 'application/octet-stream' }));
        const original = originals[0];
        const sourceName = files.length === 1 ? files[0].name : `${files.length} arquivos: ${files.map((f) => f.name).join(', ')}`;
        const glb = await upload(`${dir}/${base}.glb`, new Blob([built.glb], { type: 'model/gltf-binary' }), { access: 'public', handleUploadUrl: '/api/upload', contentType: 'model/gltf-binary' });
        const usdz = built.usdz ? await upload(`${dir}/${base}.usdz`, new Blob([built.usdz as BlobPart], { type: 'model/vnd.usdz+zip' }), { access: 'public', handleUploadUrl: '/api/upload', contentType: 'model/vnd.usdz+zip' }) : null;
        Object.assign(body, { glbUrl: glb.url, usdzUrl: usdz?.url ?? '', sourceUrl: original.url, sourceName });
      }
      const r = await fetch('/api/product-models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Erro ao salvar.');
      setSaved(d); setFiles([]); setLoaded(null); setBuilt(null);
      setMsg({ ok: true, text: d.arStatus === 'publicado' ? 'Publicado: o modelo 3D e a AR já aparecem na página do produto.' : 'Salvo como rascunho (não aparece na loja).' });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'Erro ao salvar.' }); }
    finally { setBusy(''); }
  }

  async function remove() {
    if (!productId || !confirm('Remover o modelo 3D deste produto? A página volta a mostrar só as fotos (os arquivos originais ficam guardados).')) return;
    setBusy('Removendo…');
    try {
      const r = await fetch(`/api/product-models?productId=${productId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erro ao remover.');
      setSaved(null); setFiles([]); setLoaded(null); setBuilt(null);
      setMsg({ ok: true, text: 'Modelo removido do produto.' });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'Erro ao remover.' }); }
    finally { setBusy(''); }
  }

  return (
    <section className={CARD}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Modelo 3D e realidade aumentada (3MF)</p>
          <p className="text-xs text-white/45">Envie o 3MF baixado do MakerWorld (ou STL/OBJ/GLB) e informe o comprimento e a altura reais. O cliente vê o projeto em 3D e, na câmera, o produto em tamanho real travado.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[status].cls}`}>Validação: {STATUS[status].label}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${saved?.arStatus === 'publicado' && !built ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-white/60'}`}>AR: {saved?.arStatus === 'publicado' && !built ? 'publicada' : built ? 'não salva' : saved ? 'rascunho' : 'sem modelo'}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-1 block text-xs text-white/55">Comprimento real (mm) *</span>
              <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="ex.: 150" className={inputCls} /></label>
            <label className="block"><span className="mb-1 block text-xs text-white/55">Altura real (mm) *</span>
              <input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} placeholder="ex.: 220" className={inputCls} /></label>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
            className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${dragging ? 'border-green-400 bg-green-500/10' : 'border-white/15'}`}>
            <p className="break-words text-sm text-white/80">{files.length ? <strong className="text-white">{files.length === 1 ? files[0].name : `${files.length} arquivos para unir`}</strong> : saved?.sourceName ? <>Atual: <strong className="text-white">{saved.sourceName}</strong></> : 'Arraste o 3MF pronto ou todas as peças (STL) aqui'}</p>
            <label className="mt-2 inline-block cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700">
              {files.length || saved ? 'Trocar arquivos' : 'Escolher arquivos'}
              <input type="file" multiple accept={ACCEPTED_3D} className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
            </label>
            <p className="mt-2 text-[11px] text-white/40">Um 3MF pronto ou várias peças (STL/3MF/OBJ) de uma vez: o site une tudo num modelo só · até 60 MB cada</p>
          </div>

          {loaded && (
            <div className="space-y-3 rounded-xl bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-white/55">Para cima:</span>
                {(['z', 'y'] as const).map((a) => (
                  <button key={a} type="button" onClick={() => setUp(a)} className={`rounded-full border px-3 py-1 font-semibold ${up === a ? 'border-green-500 bg-green-500/15 text-green-300' : 'border-white/15 text-white/70'}`}>{a === 'z' ? 'Z (impressão 3D)' : 'Y'}</button>
                ))}
                <span className="ml-2 text-white/55">Girar:</span>
                <button type="button" onClick={() => setRotY((r) => (r + 90) % 360)} className="rounded-full border border-white/15 px-3 py-1 font-semibold text-white/80">{rotY}° ↻</button>
              </div>
              {!loaded.hasOwnColors && (
                <label className="flex items-center gap-2 text-xs text-white/60">Cor do filamento (o arquivo não tem cor):
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-10 cursor-pointer rounded border border-white/15 bg-transparent" /></label>
              )}
              <p className="text-[11px] text-white/45">{loaded.files > 1 ? `${loaded.files} arquivos unidos · ` : ''}{loaded.parts} peça(s){loaded.hasOwnColors ? ' · cores do projeto' : ''}</p>
              {loaded.overlap && (
                <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
                  As peças vieram cada uma no mesmo lugar (o arquivo de cada peça não diz onde ela encaixa), então ficaram umas dentro das outras. Para o produto aparecer montado, use o arquivo pronto: no Bambu Studio, monte as peças (aba “Montar”) e exporte o conjunto como 3MF ou STL “como um só objeto”, ou baixe do MakerWorld o modelo já montado, se o criador oferecer.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {([['floor', 'Mesa / chão'], ['wall', 'Parede']] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPlacement(v)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${placement === v ? 'border-green-500 bg-green-500/15 text-green-300' : 'border-white/15 text-white/70 hover:bg-white/5'}`}>{l}</button>
            ))}
          </div>

          {shown && (
            <div className="rounded-xl border border-white/10 p-3 text-xs">
              <table className="w-full text-left">
                <thead className="text-white/45"><tr><th className="pb-1 font-medium">Medida</th><th className="pb-1 font-medium">Arquivo</th><th className="pb-1 font-medium">Final (AR)</th><th className="pb-1 font-medium">Real</th></tr></thead>
                <tbody className="text-white/85">
                  {([['Comprimento', 'w'], ['Altura', 'h'], ['Profundidade', 'd']] as const).map(([label, k]) => (
                    <tr key={k}>
                      <td className="py-0.5 text-white/55">{label}</td>
                      <td className="py-0.5 tabular-nums">{built ? mm(built.native[k]) : '—'}</td>
                      <td className="py-0.5 tabular-nums">{mm(shown[k])}</td>
                      <td className="py-0.5 tabular-nums">{k === 'd' ? <span className="text-white/40">pela proporção</span> : real ? mm(real[k]) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {built && <p className="mt-2 text-white/50">Escala uniforme aplicada: ×{Math.round(built.scale * 1000) / 1000} · {built.triangles.toLocaleString('pt-BR')} triângulos · GLB {kb(built.glb.byteLength)}{built.usdz ? ` · USDZ ${kb(built.usdz.byteLength)}` : ''}</p>}
              {built && proportionBad && <p className="mt-2 font-semibold text-red-300">A proporção comprimento/altura do arquivo difere {built.proportionDiffPct}% das medidas informadas. O modelo NÃO foi deformado: confira as medidas, use “Girar” ou troque o eixo “para cima”.</p>}
              {report?.messages.map((m) => <p key={m} className={`mt-1 ${status === 'bloqueado' ? 'text-red-300' : status === 'alerta' ? 'text-amber-200' : status === 'ok' ? 'text-green-300' : 'text-white/55'}`}>{m}</p>)}
              {built && built.triangles > WARN_TRIANGLES && <p className="mt-1 text-amber-200">Modelo pesado ({built.triangles.toLocaleString('pt-BR')} triângulos): pode demorar a abrir no celular.</p>}
              {built && built.glb.byteLength > WARN_GLB_BYTES && !tooBig && <p className="mt-1 text-amber-200">Arquivo grande ({kb(built.glb.byteLength)}): pode demorar a carregar no 4G.</p>}
              {tooBig && <p className="mt-1 text-red-300">GLB acima de {kb(MAX_GLB_BYTES)}: simplifique o modelo antes de publicar.</p>}
              {built && !built.usdz && <p className="mt-1 text-amber-200">USDZ não gerado ({built.usdzError}). No iPhone o visualizador gera na hora.</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(busy) || (!built && !saved)} onClick={() => save('rascunho')} className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/5 disabled:opacity-40">Salvar rascunho</button>
            <button type="button" disabled={Boolean(busy) || !canPub} onClick={() => save('publicado')} title={canPub ? '' : 'Precisa do arquivo e das medidas validadas'} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40">Publicar na loja</button>
            {saved?.arStatus === 'publicado' && !built && <button type="button" disabled={Boolean(busy)} onClick={() => save('rascunho')} className="rounded-lg px-3 py-2 text-xs text-white/60 hover:text-white">Tirar da loja</button>}
            {saved && <button type="button" disabled={Boolean(busy)} onClick={remove} className="rounded-lg px-3 py-2 text-xs text-white/50 hover:text-red-300">Remover modelo</button>}
          </div>
          {busy && <p className="text-xs text-white/60">{busy}</p>}
          {msg && <p className={`text-xs ${msg.ok ? 'text-green-300' : 'text-red-300'}`}>{msg.text}</p>}
        </div>

        <div>
          {previewSrc ? (
            <ModelBox key={previewSrc} src={previewSrc} name="Prévia" className="relative aspect-square w-full rounded-xl" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,#2a1640,#0b0614)] px-6 text-center text-xs text-white/45">A prévia 3D aparece aqui (gire e dê zoom para conferir todos os lados).</div>
          )}
        </div>
      </div>
    </section>
  );
}
