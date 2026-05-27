'use client';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';

export type FaixaData = {
  text: string;
  bgColor: string;
  textColor: string;
  animated: boolean;
};

interface Props {
  data: FaixaData;
  onChange: (data: FaixaData) => void;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium text-white/60">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 flex-shrink-0 cursor-pointer rounded border border-white/20"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#111a2f] px-2 py-1.5 font-mono text-sm text-white focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        />
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-[#0f1526] p-3 shadow-xl">
          <HexColorPicker color={value} onChange={onChange} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full cursor-pointer text-xs text-white/60 hover:text-white/85"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}

export function FaixaBloco({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div
        className="px-4 py-2.5 rounded-lg text-sm font-medium text-center"
        style={{ backgroundColor: data.bgColor, color: data.textColor }}
      >
        {data.text || 'Texto da faixa de aviso'}
        {data.animated && <span className="ml-2 inline-block animate-pulse">✦</span>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Texto</label>
        <input
          type="text"
          value={data.text}
          onChange={e => onChange({ ...data, text: e.target.value })}
          placeholder="Ex: Frete grátis em pedidos acima de €50"
          className="w-full rounded-lg border border-white/15 bg-[#111a2f] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorField label="Cor de fundo" value={data.bgColor} onChange={v => onChange({ ...data, bgColor: v })} />
        <ColorField label="Cor do texto" value={data.textColor} onChange={v => onChange({ ...data, textColor: v })} />
      </div>

      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => onChange({ ...data, animated: !data.animated })}
      >
        <div
          className={`relative h-5 w-10 rounded-full transition-colors ${data.animated ? 'bg-green-500' : 'bg-white/25'}`}
        >
          <div
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${data.animated ? 'translate-x-5' : ''}`}
          />
        </div>
        <span className="text-sm text-white/75">Animado</span>
      </div>
    </div>
  );
}
