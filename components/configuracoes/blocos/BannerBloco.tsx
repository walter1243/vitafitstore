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
  function readFileAsDataURL(file: File, callback: (url: string) => void) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function pasteSingleMedia(e: React.ClipboardEvent<HTMLDivElement>, field: 'imageUrl' | 'videoUrl') {
    for (const item of e.clipboardData.items) {
      if (!item.type.startsWith('image/') && !item.type.startsWith('video/')) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      readFileAsDataURL(file, (url) => onChange({ ...data, [field]: url }));
      return;
    }
  }

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

  function pasteCarouselMedia(e: React.ClipboardEvent<HTMLDivElement>, id: string) {
    for (const item of e.clipboardData.items) {
      if (!item.type.startsWith('image/') && !item.type.startsWith('video/')) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      readFileAsDataURL(file, (url) => updateItem(id, 'url', url));
      return;
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-white/60">Tipo de banner</label>
        <div className="flex gap-2">
          {(['image', 'video', 'carousel'] as BannerType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...data, bannerType: type })}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                data.bannerType === type
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-white/20 bg-[#111a2f] text-white/70 hover:bg-[#17223d]'
              }`}
            >
              {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'Carrossel'}
            </button>
          ))}
        </div>
      </div>

      {data.bannerType === 'image' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Imagem (Ctrl+V)</label>
          <div
            tabIndex={0}
            onPaste={(e) => pasteSingleMedia(e, 'imageUrl')}
            className="rounded-lg border border-dashed border-white/20 bg-[#111a2f] p-3 text-xs text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
          >
            Cole a mídia com Ctrl+V.
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFileAsDataURL(file, (url) => onChange({ ...data, imageUrl: url }));
            }}
            className="mt-2 w-full text-xs text-white/70"
          />
          {data.imageUrl && (
            <img
              src={data.imageUrl}
              alt="Preview"
              className="mt-2 h-32 w-full rounded-lg border border-white/10 object-cover"
            />
          )}
        </div>
      )}

      {data.bannerType === 'video' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Vídeo (Ctrl+V)</label>
          <div
            tabIndex={0}
            onPaste={(e) => pasteSingleMedia(e, 'videoUrl')}
            className="rounded-lg border border-dashed border-white/20 bg-[#111a2f] p-3 text-xs text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
          >
            Cole o vídeo com Ctrl+V.
          </div>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFileAsDataURL(file, (url) => onChange({ ...data, videoUrl: url }));
            }}
            className="mt-2 w-full text-xs text-white/70"
          />
          {data.videoUrl && (
            <video src={data.videoUrl} className="mt-2 h-32 w-full rounded-lg border border-white/10 object-cover" controls />
          )}
        </div>
      )}

      {data.bannerType === 'carousel' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">Itens do carrossel</label>
            <button
              type="button"
              onClick={addItem}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {data.carouselItems.map((item, idx) => (
              <div key={item.id} className="space-y-2 rounded-lg border border-white/10 bg-[#111a2f] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/40">Item {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-rose-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div
                  tabIndex={0}
                  onPaste={(e) => pasteCarouselMedia(e, item.id)}
                  className="rounded-lg border border-dashed border-white/20 bg-[#0f1526] p-2 text-[11px] text-white/60 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/30"
                >
                  {item.url
                    ? (item.url.startsWith('data:video/')
                      ? <video src={item.url} className="h-20 w-full rounded border border-white/10 object-cover" controls />
                      : <img src={item.url} alt={item.alt || 'Preview'} className="h-20 w-full rounded border border-white/10 object-cover" />)
                    : <p>Cole mídia com Ctrl+V</p>}
                </div>
                <input
                  type="text"
                  value={item.alt}
                  onChange={e => updateItem(item.id, 'alt', e.target.value)}
                  placeholder="Texto alternativo"
                  className="w-full rounded-lg border border-white/15 bg-[#0f1526] px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
              </div>
            ))}
            {data.carouselItems.length === 0 && (
              <p className="py-4 text-center text-xs text-white/40">Nenhum item. Clique em Adicionar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
