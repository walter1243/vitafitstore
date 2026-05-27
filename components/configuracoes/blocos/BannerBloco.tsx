'use client';
import { Plus, Trash2 } from 'lucide-react';

type BannerType = 'image' | 'video' | 'carousel';

export type CarouselItem = { id: string; url: string; alt: string };

export type BannerData = {
  bannerType: BannerType;
  imageUrl: string;
  videoUrl: string;
  carouselItems: CarouselItem[];
};

interface Props {
  data: BannerData;
  onChange: (data: BannerData) => void;
}

export function BannerBloco({ data, onChange }: Props) {
  function addItem() {
    onChange({
      ...data,
      carouselItems: [...data.carouselItems, { id: String(Date.now()), url: '', alt: '' }],
    });
  }

  function updateItem(id: string, field: 'url' | 'alt', value: string) {
    onChange({
      ...data,
      carouselItems: data.carouselItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  }

  function removeItem(id: string) {
    onChange({ ...data, carouselItems: data.carouselItems.filter(item => item.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">Tipo de banner</label>
        <div className="flex gap-2">
          {(['image', 'video', 'carousel'] as BannerType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...data, bannerType: type })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                data.bannerType === type
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'Carrossel'}
            </button>
          ))}
        </div>
      </div>

      {data.bannerType === 'image' && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">URL da imagem</label>
          <input
            type="url"
            value={data.imageUrl}
            onChange={e => onChange({ ...data, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
          {data.imageUrl && (
            <img
              src={data.imageUrl}
              alt="Preview"
              className="mt-2 w-full h-32 object-cover rounded-lg border border-slate-200"
            />
          )}
        </div>
      )}

      {data.bannerType === 'video' && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">URL do vídeo</label>
          <input
            type="url"
            value={data.videoUrl}
            onChange={e => onChange({ ...data, videoUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
        </div>
      )}

      {data.bannerType === 'carousel' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Itens do carrossel</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {data.carouselItems.map((item, idx) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Item {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-rose-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  type="url"
                  value={item.url}
                  onChange={e => updateItem(item.id, 'url', e.target.value)}
                  placeholder="URL da imagem"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
                <input
                  type="text"
                  value={item.alt}
                  onChange={e => updateItem(item.id, 'alt', e.target.value)}
                  placeholder="Texto alternativo"
                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
            ))}
            {data.carouselItems.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Nenhum item. Clique em Adicionar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
