'use client';

type CriteriaType = 'mais-vendidos' | 'novidades' | 'oferta' | 'manual';

export type DestaqueData = {
  title: string;
  quantity: number;
  criteria: CriteriaType;
  mobileColumns: 1 | 2;
};

interface Props {
  data: DestaqueData;
  onChange: (data: DestaqueData) => void;
}

const CRITERIA_OPTIONS: { value: CriteriaType; label: string }[] = [
  { value: 'mais-vendidos', label: 'Mais vendidos' },
  { value: 'novidades', label: 'Novidades' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'manual', label: 'Manual' },
];

export function DestaqueBloco({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Título da seção</label>
        <input
          type="text"
          value={data.title}
          onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="Ex: Produtos em Destaque"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Quantidade de produtos:{' '}
          <span className="text-green-600 font-semibold">{data.quantity}</span>
        </label>
        <input
          type="range"
          min={2}
          max={12}
          value={data.quantity}
          onChange={e => onChange({ ...data, quantity: Number(e.target.value) })}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>2</span>
          <span>12</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Critério de seleção</label>
        <div className="grid grid-cols-2 gap-2">
          {CRITERIA_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="destaque-criteria"
                value={opt.value}
                checked={data.criteria === opt.value}
                onChange={() => onChange({ ...data, criteria: opt.value })}
                className="accent-green-500"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Colunas no mobile</label>
        <div className="flex gap-4">
          {[1, 2].map(cols => (
            <label key={cols} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="destaque-mobile-cols"
                value={cols}
                checked={data.mobileColumns === cols}
                onChange={() => onChange({ ...data, mobileColumns: cols as 1 | 2 })}
                className="accent-green-500"
              />
              <span className="text-sm text-slate-700">
                {cols} coluna{cols > 1 ? 's' : ''}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
