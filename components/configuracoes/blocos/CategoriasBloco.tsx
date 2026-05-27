'use client';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export type CategoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  link: string;
  visible: boolean;
};

export type CategoriasData = {
  title: string;
  categories: CategoryItem[];
  layout: 'grid' | 'row';
  style: 'card' | 'pill' | 'minimal';
};

interface Props {
  data: CategoriasData;
  onChange: (data: CategoriasData) => void;
}

export function CategoriasBloco({ data, onChange }: Props) {
  function addCategory() {
    onChange({
      ...data,
      categories: [
        ...data.categories,
        { id: String(Date.now()), name: '', imageUrl: '', link: '', visible: true },
      ],
    });
  }

  function updateCategory(id: string, field: keyof CategoryItem, value: string | boolean) {
    onChange({
      ...data,
      categories: data.categories.map(cat =>
        cat.id === id ? { ...cat, [field]: value } : cat
      ),
    });
  }

  function removeCategory(id: string) {
    onChange({ ...data, categories: data.categories.filter(cat => cat.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Título da seção</label>
        <input
          type="text"
          value={data.title}
          onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="Ex: Nossas Categorias"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Layout</label>
          <select
            value={data.layout}
            onChange={e => onChange({ ...data, layout: e.target.value as 'grid' | 'row' })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white"
          >
            <option value="grid">Grade</option>
            <option value="row">Linha</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Estilo</label>
          <select
            value={data.style}
            onChange={e => onChange({ ...data, style: e.target.value as 'card' | 'pill' | 'minimal' })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white"
          >
            <option value="card">Card</option>
            <option value="pill">Pill</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-500">
            Categorias ({data.categories.length})
          </label>
          <button
            type="button"
            onClick={addCategory}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer"
          >
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {data.categories.map((cat, idx) => (
            <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCategory(cat.id, 'visible', !cat.visible)}
                    className={`cursor-pointer ${cat.visible ? 'text-green-500' : 'text-slate-400'}`}
                    title={cat.visible ? 'Visível' : 'Oculto'}
                  >
                    {cat.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(cat.id)}
                    className="text-rose-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={cat.name}
                  onChange={e => updateCategory(cat.id, 'name', e.target.value)}
                  placeholder="Nome"
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
                <input
                  type="text"
                  value={cat.link}
                  onChange={e => updateCategory(cat.id, 'link', e.target.value)}
                  placeholder="Link (ex: /saude)"
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
              <input
                type="url"
                value={cat.imageUrl}
                onChange={e => updateCategory(cat.id, 'imageUrl', e.target.value)}
                placeholder="URL da imagem"
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>
          ))}
          {data.categories.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Nenhuma categoria. Clique em Adicionar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
