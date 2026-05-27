'use client';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

export type CategoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  logoUrl?: string;
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
        { id: String(Date.now()), name: '', imageUrl: '', logoUrl: '', link: '', visible: true },
      ],
      layout: 'row',
      style: 'card',
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

  function readFileAsDataURL(file: File, callback: (url: string) => void) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function pasteMedia(e: React.ClipboardEvent<HTMLDivElement>, id: string, field: 'imageUrl' | 'logoUrl') {
    for (const item of e.clipboardData.items) {
      if (!item.type.startsWith('image/')) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      readFileAsDataURL(file, (url) => updateCategory(id, field, url));
      return;
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-white/60">Título da seção</label>
        <input
          type="text"
          value={data.title}
          onChange={e => onChange({ ...data, title: e.target.value })}
          placeholder="Ex: Nossas Categorias"
          className="w-full rounded-lg border border-white/15 bg-[#0f1526] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Layout</label>
          <div className="rounded-lg border border-white/10 bg-[#0f1526] px-3 py-2 text-sm font-medium text-white/85">Carrossel (fixo)</div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Estilo</label>
          <div className="rounded-lg border border-white/10 bg-[#0f1526] px-3 py-2 text-sm font-medium text-white/85">Cards da vitrine (fixo)</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-white/60">
            Categorias ({data.categories.length})
          </label>
          <button
            type="button"
            onClick={addCategory}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300"
          >
            <Plus size={13} /> Adicionar
          </button>
        </div>
        <div className="space-y-2">
          {data.categories.map((cat, idx) => (
            <div key={cat.id} className="space-y-2 rounded-lg border border-white/10 bg-[#0f1526] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/40">#{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCategory(cat.id, 'visible', !cat.visible)}
                    className={`cursor-pointer ${cat.visible ? 'text-green-400' : 'text-white/35'}`}
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
                  className="rounded-lg border border-white/15 bg-[#111a2f] px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <input
                  type="text"
                  value={cat.link}
                  onChange={e => updateCategory(cat.id, 'link', e.target.value)}
                  placeholder="Link (ex: /saude)"
                  className="rounded-lg border border-white/15 bg-[#111a2f] px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div
                  tabIndex={0}
                  onPaste={(e) => pasteMedia(e, cat.id, 'imageUrl')}
                  className="rounded-lg border border-dashed border-white/15 bg-[#111a2f] p-2 text-[11px] text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
                >
                  <p className="mb-1 uppercase tracking-wide text-white/40">Imagem do card</p>
                  {cat.imageUrl
                    ? <img src={cat.imageUrl} alt={`${cat.name} capa`} className="h-14 w-full rounded border border-white/10 object-cover" />
                    : <p>Cole com Ctrl+V</p>}
                </div>
                <div
                  tabIndex={0}
                  onPaste={(e) => pasteMedia(e, cat.id, 'logoUrl')}
                  className="rounded-lg border border-dashed border-white/15 bg-[#111a2f] p-2 text-[11px] text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
                >
                  <p className="mb-1 uppercase tracking-wide text-white/40">Logo</p>
                  {cat.logoUrl
                    ? <img src={cat.logoUrl} alt={`${cat.name} logo`} className="h-14 w-full rounded border border-white/10 object-contain bg-black/20" />
                    : <p>Cole com Ctrl+V</p>}
                </div>
              </div>
            </div>
          ))}
          {data.categories.length === 0 && (
            <p className="py-4 text-center text-xs text-white/40">
              Nenhuma categoria. Clique em Adicionar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
