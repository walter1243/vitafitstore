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
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded border border-slate-200 cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white rounded-xl shadow-xl border border-slate-100 p-3">
          <HexColorPicker color={value} onChange={onChange} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
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
        <label className="block text-xs font-medium text-slate-500 mb-1">Texto</label>
        <input
          type="text"
          value={data.text}
          onChange={e => onChange({ ...data, text: e.target.value })}
          placeholder="Ex: Frete grátis em pedidos acima de €50"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
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
          className={`relative w-10 h-5 rounded-full transition-colors ${data.animated ? 'bg-green-500' : 'bg-slate-200'}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.animated ? 'translate-x-5' : ''}`}
          />
        </div>
        <span className="text-sm text-slate-700">Animado</span>
      </div>
    </div>
  );
}
