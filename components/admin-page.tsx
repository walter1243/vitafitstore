'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BlocosEditor, type BlocosEditorHandle } from '@/components/configuracoes/BlocosEditor';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Settings,
  Menu, X, Plus, Trash2, ExternalLink, Check, Euro,
  ChevronRight, Upload, Video, AlertCircle, CheckCircle2,
  ArrowUp, ArrowDown, Monitor, Zap, ToggleLeft, ToggleRight,
  MessageCircle, Mail, Globe, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'dashboard' | 'products' | 'orders' | 'tracking' | 'settings' | 'automation';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  mainImage?: string;
  additionalImages?: string[];
  videoUrl?: string;
  video?: string;
  description?: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  position: number;
  enabled: boolean;
  bannerType?: 'image' | 'video';
  bannerUrl?: string;
  logoUrl?: string;
};

type Order = {
  id: number;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  addressLine?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  product: string;
  status: 'pending' | 'shipped' | 'delivered';
  tracking: string;
  total: number;
  date: string;
};

type Toast = { id: number; type: 'success' | 'error'; msg: string };

const SECTION_LABELS: Record<Section, string> = {
  dashboard: 'Dashboard',
  products: 'Produtos',
  orders: 'Pedidos',
  tracking: 'Rastreio',
  automation: 'Automação',
  settings: 'Editar loja',
};

function ProductsSection({ products, showForm, saving, form, image, additionalImages, desc, upsellIds,
  onToggleForm, onFormChange, onImageChange, onAdditionalImagesChange, onDescChange, onUpsellChange, onSubmit, onDelete, onMove,
  categories, newCategoryName, onNewCategoryNameChange, onCreateCategory,
  onMoveCategory, onSaveCategoryMedia, onDeleteCategory, editingProductId, onEditProduct }: {
  products: Product[];
  categories: Category[];
  showForm: boolean;
  saving: boolean;
  form: { name: string; price: string; category: string; stock: string; videoUrl: string };
  image: string | null;
  additionalImages: string[];
  desc: string;
  upsellIds: number[];
  newCategoryName: string;
  editingProductId: number | null;
  onToggleForm: () => void;
  onEditProduct: (p: Product) => void;
  onFormChange: (k: string, v: string) => void;
  onImageChange: (v: string | null) => void;
  onAdditionalImagesChange: (v: string[]) => void;
  onDescChange: (v: string) => void;
  onUpsellChange: (ids: number[]) => void;
  onNewCategoryNameChange: (v: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: number, direction: 'up' | 'down') => void;
  onSaveCategoryMedia: (id: number, bannerType: 'image' | 'video', bannerUrl: string, logoUrl: string) => void;
  onDeleteCategory: (id: number, name: string) => void;
  onSubmit: () => void;
  onDelete: (id: number, name: string) => void;
  onMove: (id: number, direction: 'up' | 'down') => void;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const mainFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [mainUploadBusy, setMainUploadBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [mainFileInfo, setMainFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [formTab, setFormTab] = useState<'dados' | 'upsell'>('dados');
  const [upsellCategoryFilter, setUpsellCategoryFilter] = useState('');
  const [productViewTab, setProductViewTab] = useState<'products' | 'cards'>('products');
  const [categoryDrafts, setCategoryDrafts] = useState<Record<number, { bannerType: 'image' | 'video'; bannerUrl: string; logoUrl: string }>>({});

  useEffect(() => {
    const next: Record<number, { bannerType: 'image' | 'video'; bannerUrl: string; logoUrl: string }> = {};
    for (const c of categories) {
      next[c.id] = {
        bannerType: c.bannerType === 'video' ? 'video' : 'image',
        bannerUrl: c.bannerUrl ?? '',
        logoUrl: c.logoUrl ?? '',
      };
    }
    setCategoryDrafts(next);
  }, [categories]);

  useEffect(() => {
    if (descRef.current && descRef.current.innerHTML !== desc) {
      descRef.current.innerHTML = desc;
    }
  }, [desc, showForm]);

  function readFileAsDataURL(file: File, cb: (url: string) => void) {
    const r = new FileReader();
    r.onload = e => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  function handleMainFile(file: File | null) {
    if (!file) return;
    setMainUploadBusy(true);
    setMainFileInfo({ name: file.name, size: file.size });
    readFileAsDataURL(file, url => {
      onImageChange(url);
      setMainUploadBusy(false);
    });
  }

  function handleAdditionalFiles(files: FileList | null) {
    if (!files?.length) return;
    setGalleryBusy(true);
    const accepted = Array.from(files).filter(file => /^(image\/(jpeg|png|webp|avif)|video\/mp4)$/i.test(file.type));
    const slotsLeft = Math.max(0, 10 - additionalImages.length);
    const queue = accepted.slice(0, slotsLeft);
    if (queue.length === 0) {
      setGalleryBusy(false);
      return;
    }

    let pending = queue.length;
    const next: string[] = [];

    queue.forEach(file => {
      readFileAsDataURL(file, url => {
        next.push(url);
        pending -= 1;
        if (pending === 0) {
          onAdditionalImagesChange([...additionalImages, ...next]);
          setGalleryBusy(false);
        }
      });
    });
  }

  function handleUploadPaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) {
          handleMainFile(f);
          break;
        }
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleMainFile(f);
  }

  function handleDescPaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const f = item.getAsFile();
        if (!f) continue;
        readFileAsDataURL(f, url => {
          document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;border-radius:12px;margin:8px 0;display:block;" />`);
          onDescChange(descRef.current?.innerHTML ?? '');
        });
        return;
      }
    }
  }

  const fields = [
    { k: 'name', label: 'Nome do produto *', ph: 'Ex: Whey Protein 1kg', type: 'text' },
    { k: 'price', label: 'Preço (€) *', ph: '29.99', type: 'number' },
    { k: 'stock', label: 'Estoque (un.)', ph: '100', type: 'number' },
  ];

  const visibleAdditionalImages = additionalImages.slice(0, 10);

  function stripHtml(html: string) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function removeAdditionalImage(index: number) {
    onAdditionalImagesChange(additionalImages.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveAdditionalImage(index: number, direction: 'left' | 'right') {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= additionalImages.length) return;
    const copy = [...additionalImages];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onAdditionalImagesChange(copy);
  }

  return (
    <div className="space-y-5 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-white">
              {productViewTab === 'products' ? <Package size={16} className="text-green-500" /> : <Settings size={16} className="text-green-500" />}
              {productViewTab === 'products'
                ? (showForm ? (editingProductId ? 'Editar Produto' : 'Novo Produto') : 'Produtos')
                : 'Cards das categorias (loja)'}
            </h2>
            <p className="mt-1 text-xs text-white/50">
              {productViewTab === 'products'
                ? 'Formulário em blocos com imagem principal, galeria e conteúdo rico.'
                : 'Configure o banner e a logo dos cards de categoria em uma aba separada do cadastro de produtos.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-white/10 bg-[#0f1117] p-1">
              <button
                type="button"
                onClick={() => setProductViewTab('products')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${productViewTab === 'products' ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
              >
                Produtos
              </button>
              <button
                type="button"
                onClick={() => setProductViewTab('cards')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${productViewTab === 'cards' ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
              >
                Cards da loja
              </button>
            </div>
            {productViewTab === 'products' && (
              <button
                type="button"
                onClick={onToggleForm}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
              >
                {showForm ? <><X size={13} />Fechar</> : <><Plus size={13} />Novo produto</>}
              </button>
            )}
          </div>
        </div>

        {productViewTab === 'products' && showForm && (
          <div className="space-y-5 p-5">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-none">
                <div className="mb-4 flex items-center gap-2">
                  <Package size={16} className="text-green-500" />
                  <h3 className="text-sm font-semibold text-white">Informações básicas</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map(field => (
                    <div key={field.k} className={field.k === 'name' ? 'sm:col-span-2' : ''}>
                      <label className="mb-1.5 block text-xs font-medium text-white/50">{field.label}</label>
                      <input
                        type={field.type}
                        value={form[field.k as keyof typeof form]}
                        onChange={e => onFormChange(field.k, e.target.value)}
                        placeholder={field.ph}
                        step={field.type === 'number' ? '0.01' : undefined}
                        className="w-full rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Categoria da loja</label>
                    <select
                      value={form.category}
                      onChange={e => onFormChange('category', e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.filter(c => c.enabled).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Preço formatado</label>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70">
                      €{(Number(form.price || 0) || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-none">
                <div className="mb-4 flex items-center gap-2">
                  <Upload size={16} className="text-green-500" />
                  <h3 className="text-sm font-semibold text-white">Imagem principal do produto</h3>
                </div>
                <div
                  ref={dropRef}
                  tabIndex={0}
                  onPaste={handleUploadPaste}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40 ${
                    drag ? 'border-green-500 bg-white/5' : 'border-white/10 bg-[#22263a] hover:bg-white/5'
                  }`}
                >
                  <input
                    ref={mainFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={e => handleMainFile(e.target.files?.[0] ?? null)}
                  />
                  {mainUploadBusy ? (
                    <div className="flex flex-col items-center gap-3 text-white/60">
                      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-green-500" />
                      Processando imagem...
                    </div>
                  ) : image ? (
                    <div className="relative w-full">
                      <div className="relative mx-auto aspect-[4/3] max-h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117]">
                        <img src={image} alt="Preview do produto" className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-3 flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
                        <div className="text-sm font-medium text-white">{mainFileInfo?.name ?? 'Imagem selecionada'}</div>
                        <div className="text-xs text-white/50">
                          {mainFileInfo ? `${Math.max(1, Math.round(mainFileInfo.size / 1024))} KB` : 'Preview carregado'}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => mainFileRef.current?.click()}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Trocar imagem
                          </button>
                          <button
                            type="button"
                            onClick={() => { onImageChange(null); setMainFileInfo(null); }}
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                          >
                            Remover imagem
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/60">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-green-500">
                        <Upload size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Arraste, clique ou cole a imagem</p>
                        <p className="mt-1 text-xs text-white/45">JPG, PNG, WebP e AVIF. Tamanho mínimo recomendado: 1200px.</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-white/45">Suporte a Ctrl+V, drag and drop e arquivos de até 10 imagens adicionais no bloco seguinte.</p>
              </section>
            </div>

            <section className="rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-none">
              <div className="mb-4 flex items-center gap-2">
                <Video size={16} className="text-green-500" />
                <h3 className="text-sm font-semibold text-white">Descrição do produto</h3>
              </div>
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handleDescPaste}
                onInput={() => onDescChange(descRef.current?.innerHTML ?? '')}
                className="min-h-[220px] rounded-2xl border border-white/10 bg-[#22263a] px-4 py-3 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                style={{ lineHeight: '1.7' }}
                data-placeholder="Descreva benefícios, composição, instruções e provas sociais. Cole imagens diretamente aqui com Ctrl+V."
              />
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/45">
                <span>Use negrito, listas e imagens inline para vender melhor.</span>
                <span>{stripHtml(desc).length} caracteres</span>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-none">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-green-500" />
                  <h3 className="text-sm font-semibold text-white">Mídia adicional</h3>
                </div>
                <span className="text-xs text-white/45">Máximo de 10 fotos</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={e => onFormChange('videoUrl', e.target.value)}
                      placeholder="URL do vídeo do produto (YouTube ou MP4)"
                      className="w-full rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40 sm:col-span-2"
                    />
                    <input
                      ref={galleryFileRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={e => handleAdditionalFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => galleryFileRef.current?.click()}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      + Adicionar foto
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={galleryUrl}
                        onChange={e => setGalleryUrl(e.target.value)}
                        placeholder="Cole uma URL de foto"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!galleryUrl.trim() || additionalImages.length >= 10) return;
                          onAdditionalImagesChange([...additionalImages, galleryUrl.trim()]);
                          setGalleryUrl('');
                        }}
                        className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {visibleAdditionalImages.map((src, index) => (
                      <div key={`${src}-${index}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#22263a]">
                        <img src={src} alt={`Foto adicional ${index + 1}`} className="h-28 w-full object-cover" />
                        <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500"
                            aria-label="Remover foto"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1 text-[10px] text-white/80 opacity-100">
                          <button type="button" onClick={() => moveAdditionalImage(index, 'left')} className="hover:text-white" aria-label="Mover para esquerda">←</button>
                          <span>{index + 1}/{Math.min(additionalImages.length, 10)}</span>
                          <button type="button" onClick={() => moveAdditionalImage(index, 'right')} className="hover:text-white" aria-label="Mover para direita">→</button>
                        </div>
                      </div>
                    ))}
                    {galleryBusy && (
                      <div className="flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Preview da galeria</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {visibleAdditionalImages.slice(0, 4).map((src, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#22263a]">
                        <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {visibleAdditionalImages.length === 0 && (
                      <div className="col-span-2 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/45">
                        As fotos adicionais aparecerão aqui.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-1">
              <button
                type="button"
                onClick={onSubmit}
                disabled={saving || !form.name.trim() || !form.price.trim()}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Check size={15} />}
                {saving ? 'Salvando...' : editingProductId ? 'Salvar alterações' : 'Cadastrar Produto'}
              </button>
            </div>
          </div>
        )}

        {productViewTab === 'cards' && (
          <div className="space-y-3 p-5">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => onNewCategoryNameChange(e.target.value)}
                placeholder="Ex: Suplementos"
                className="flex-1 rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
              />
              <button
                type="button"
                onClick={onCreateCategory}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"
              >
                Criar categoria
              </button>
            </div>

            <div className="space-y-3">
              {categories.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/45">Crie categorias para liberar a edição de banner e logo.</div>
              )}
              {categories.map((c, idx) => {
                const draft = categoryDrafts[c.id] ?? { bannerType: 'image' as const, bannerUrl: '', logoUrl: '' };
                return (
                  <div key={c.id} className="space-y-3 rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-white/50">{idx + 1}</span>
                      <span className="flex-1 text-sm font-medium text-white">{c.name}</span>
                      <button type="button" onClick={() => onMoveCategory(c.id, 'up')} className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5" title="Subir categoria"><ArrowUp size={12} /></button>
                      <button type="button" onClick={() => onMoveCategory(c.id, 'down')} className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5" title="Descer categoria"><ArrowDown size={12} /></button>
                      <button type="button" onClick={() => onDeleteCategory(c.id, c.name)} className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10" title="Excluir categoria"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <select
                        value={draft.bannerType}
                        onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, bannerType: e.target.value === 'video' ? 'video' : 'image' } }))}
                        className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="image">Banner imagem</option>
                        <option value="video">Banner vídeo</option>
                      </select>
                      <input
                        type="text"
                        value={draft.bannerUrl}
                        onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, bannerUrl: e.target.value } }))}
                        placeholder="URL do banner (img/video)"
                        className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white outline-none sm:col-span-2"
                      />
                      <input
                        type="text"
                        value={draft.logoUrl}
                        onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, logoUrl: e.target.value } }))}
                        placeholder="URL da logo da categoria (opcional)"
                        className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white outline-none sm:col-span-2"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveCategoryMedia(c.id, draft.bannerType, draft.bannerUrl, draft.logoUrl)}
                        className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Salvar mídia
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {productViewTab === 'products' && (
      <TableCard title={`Todos os produtos (${products.length})`} icon={<Package size={15} className="text-green-500" />}>
        <table className="w-full text-sm">
          <thead className="bg-[#0f1117]">
            <tr>
              {['Produto', 'Categoria', 'Preço', 'Estoque', 'Ações'].map(h => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.map(p => {
              const stock = p.stock ?? 0;
              const stockClass = stock > 10 ? 'text-emerald-400' : stock > 0 ? 'text-amber-400' : 'text-red-400';
              const preview = p.mainImage ?? p.image;
              return (
                <tr key={p.id} className="group transition-colors hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {preview ? (
                        <img src={preview} alt={p.name} className="h-12 w-12 shrink-0 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"><Package size={15} className="text-white/40" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{p.name}</div>
                        <div className="mt-1 max-w-[260px] truncate text-xs text-white/45">{stripHtml(p.description ?? '') || 'Sem descrição'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/70">{p.category || '—'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap font-semibold text-white">€{(p.price ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-xs font-semibold ${stockClass}`}>{stock} un.</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditProduct(p)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/5"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id, p.name)}
                        className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-white/45">Nenhum produto cadastrado ainda</td>
              </tr>
            )}
          </tbody>
        </table>
      </TableCard>
      )}
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrdersSection({ orders, onUpdateTracking }: {
  orders: Order[];
  onUpdateTracking: (id: number, tracking: string, status: Order['status']) => void;
}) {
  const [inputs, setInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    setInputs(Object.fromEntries(orders.map(o => [o.id, o.tracking ?? ''])));
  }, [orders]);

  function save(id: number) {
    const tracking = inputs[id] ?? '';
    onUpdateTracking(id, tracking, tracking ? 'shipped' : 'pending');
  }

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div key={o.id} className="rounded-2xl border border-white/10 bg-[#1a1d27] p-4 shadow-none sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-mono text-sm font-bold text-white">#{o.id}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-xs text-white/40">{o.date}</div>
            </div>
            <div className="text-lg font-bold text-white">€{(o.total??0).toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Cliente</div><div className="font-medium text-white">{o.customer}</div></div>
            <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Produto</div><div className="text-white/70">{o.product}</div></div>
            <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Contato</div><div className="text-white/70">{o.customerEmail || '—'} {o.customerPhone ? `• ${o.customerPhone}` : ''}</div></div>
            <div className="sm:col-span-3"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Endereço</div><div className="text-white/70">{o.addressLine || '—'} {o.postalCode ? `• ${o.postalCode}` : ''} {o.city ? `• ${o.city}` : ''} {o.country ? `• ${o.country}` : ''}</div></div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={inputs[o.id] ?? ''}
              onChange={e => setInputs(t => ({ ...t, [o.id]: e.target.value }))}
              placeholder="Código de rastreio (ex: ES123456789ES)"
              className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
            />
            <button onClick={() => save(o.id)}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700">
              <Check size={14} />Salvar
            </button>
            {o.tracking && (
              <a href={`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${o.tracking}`}
                target="_blank" rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5">
                <ExternalLink size={14} />Rastrear
              </a>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-10 text-center text-sm text-white/45 shadow-none">
          Nenhum pedido encontrado
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewport, setViewport] = useState('—');
  const toastId = useRef(0);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', price: '', category: '', stock: '', videoUrl: '' });
  const [prodImage, setProdImage] = useState<string | null>(null);
  const [prodAdditionalImages, setProdAdditionalImages] = useState<string[]>([]);
  const [prodDesc, setProdDesc] = useState('');
  const [prodUpsellIds, setProdUpsellIds] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState<{ id: number; name: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const addToast = useCallback((type: Toast['type'], msg: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  useEffect(() => { void fetchData(); }, []);

  useEffect(() => {
    const updateViewport = () => setViewport(`${window.innerWidth}x${window.innerHeight}px`);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  async function fetchData() {
    try {
      const [pr, or, cr] = await Promise.all([fetch('/api/products'), fetch('/api/orders'), fetch('/api/categories')]);
      if (pr.ok) setProducts(await pr.json());
      if (or.ok) setOrders(await or.json());
      if (cr.ok) setCategories(await cr.json());
    } catch {
      // silently ignore — DB might not be configured yet
    }
  }

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      addToast('error', 'Digite um nome para a categoria.');
      return;
    }

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setNewCategoryName('');
      await fetchData();
      setProdForm(f => ({ ...f, category: data?.name ?? f.category }));
      addToast('success', 'Categoria criada com sucesso.');
    } else {
      addToast('error', data?.error ?? 'Erro ao criar categoria.');
    }
  }

  async function moveCategory(id: number, direction: 'up' | 'down') {
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'move', id, direction }),
    });

    if (res.ok) {
      await fetchData();
      addToast('success', 'Ordem das categorias atualizada.');
    } else {
      const data = await res.json().catch(() => ({}));
      addToast('error', data?.error ?? 'Falha ao mover categoria.');
    }
  }

  async function saveCategoryMedia(id: number, bannerType: 'image' | 'video', bannerUrl: string, logoUrl: string) {
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateMedia', id, bannerType, bannerUrl, logoUrl }),
    });

    if (res.ok) {
      await fetchData();
      addToast('success', 'Mídia da categoria atualizada.');
    } else {
      const data = await res.json().catch(() => ({}));
      addToast('error', data?.error ?? 'Falha ao salvar mídia da categoria.');
    }
  }

  async function deleteCategory(id: number, name: string) {
    setPendingCategoryDelete({ id, name });
  }

  async function confirmDeleteCategory() {
    if (!pendingCategoryDelete || deletingCategory) return;
    setDeletingCategory(true);

    const { id, name } = pendingCategoryDelete;

    const res = await fetch(`/api/categories?id=${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await fetchData();
      addToast('success', `Categoria \"${name}\" removida.`);
      setProdForm(f => (f.category === name ? { ...f, category: '' } : f));
      setPendingCategoryDelete(null);
    } else {
      const data = await res.json().catch(() => ({}));
      addToast('error', data?.error ?? 'Falha ao remover categoria.');
    }

    setDeletingCategory(false);
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProdForm({ name: '', price: '', category: '', stock: '', videoUrl: '' });
    setProdImage(null);
    setProdAdditionalImages([]);
    setProdDesc('');
    setProdUpsellIds([]);
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProdForm({
      name: product.name ?? '',
      price: product.price != null ? String(product.price) : '',
      category: product.category ?? '',
      stock: product.stock != null ? String(product.stock) : '',
      videoUrl: product.videoUrl ?? product.video ?? '',
    });
    setProdImage(product.mainImage ?? product.image ?? null);
    setProdAdditionalImages(Array.isArray(product.additionalImages) ? product.additionalImages : []);
    setProdDesc(product.description ?? '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function addProduct() {
    const isEditing = editingProductId !== null;
    if (!prodForm.name.trim()) { addToast('error', 'Nome do produto é obrigatório.'); return; }
    if (!prodForm.price) { addToast('error', 'Preço é obrigatório.'); return; }
    if (!prodForm.category.trim()) { addToast('error', 'Selecione uma categoria.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProductId,
          name: prodForm.name.trim(),
          price: parseFloat(prodForm.price),
          category: prodForm.category.trim(),
          stock: parseInt(prodForm.stock) || 0,
          videoUrl: prodForm.videoUrl.trim() || null,
          description: prodDesc || null,
          mainImage: prodImage,
          image: prodImage,
          additionalImages: prodAdditionalImages,
          upsellIds: prodUpsellIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (isEditing) {
          setProducts(p => p.map(item => item.id === editingProductId ? data : item));
        } else {
          setProducts(p => [data, ...p]);
        }
        const successMessage = isEditing ? `"${data.name}" atualizado com sucesso!` : `"${data.name}" cadastrado com sucesso!`;
        resetProductForm();
        setShowForm(false);
        addToast('success', successMessage);
      } else {
        addToast('error', data?.error ?? 'Erro ao cadastrar produto.');
      }
    } catch (e: any) {
      addToast('error', e?.message ?? 'Erro de conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: number, name: string) {
    setProducts(p => p.filter(x => x.id !== id));
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) addToast('success', `"${name}" removido.`);
    else addToast('error', 'Falha ao remover produto.');
  }

  async function moveProduct(id: number, direction: 'up' | 'down') {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    });

    if (res.ok) {
      await fetchData();
      addToast('success', 'Ordem de produtos atualizada.');
    } else {
      const data = await res.json().catch(() => ({}));
      addToast('error', data?.error ?? 'Falha ao mover produto.');
    }
  }

  async function updateTracking(id: number, tracking: string, status: Order['status']) {
    setOrders(o => o.map(x => x.id === id ? { ...x, tracking, status } : x));
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, tracking, status }),
    });
    if (res.ok) addToast('success', 'Rastreio actualizado.');
    else addToast('error', 'Falha ao actualizar rastreio.');
  }

  const revenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  function navigate(s: Section) {
    setSection(s);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'products', label: 'Produtos', icon: <Package size={18} /> },
    { key: 'orders', label: 'Pedidos', icon: <ShoppingCart size={18} />, badge: pendingCount || undefined },
    { key: 'tracking', label: 'Rastreio', icon: <Truck size={18} /> },
    { key: 'automation', label: 'Automação', icon: <Zap size={18} /> },
    { key: 'settings', label: 'Editar loja', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-white">
      {pendingCategoryDelete && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Excluir categoria</h3>
            <p className="mt-2 text-sm text-white/70">
              Tem certeza que deseja excluir a categoria <strong className="text-white">{pendingCategoryDelete.name}</strong>?
            </p>
            <p className="mt-2 text-xs text-white/45">
              Os produtos dessa categoria serão movidos para "geral" na vitrine.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingCategoryDelete(null)}
                disabled={deletingCategory}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={deletingCategory}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deletingCategory ? 'Excluindo...' : 'Excluir categoria'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200 ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {t.type === 'success'
              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="shrink-0 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-900 text-white transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0`}>
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-600 text-lg font-bold">V</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">VitaFit Admin</div>
            <div className="text-[11px] text-white/40">Painel de Controle</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto rounded p-1 text-white/50 hover:text-white lg:hidden">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</div>
          {navItems.map(item => (
            <button key={item.key} onClick={() => navigate(item.key)} className={`flex w-full items-center gap-3 border-l-2 px-5 py-3 text-sm transition-colors ${section === item.key ? 'border-green-500 bg-white/10 text-white' : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'}`}>
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? <span className="min-w-[18px] rounded-full bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-5 py-4 text-center text-[11px] text-white/30">VitaFit © 2025</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 shrink-0 border-b border-white/10 bg-[#1a1d27] px-4 shadow-none sm:h-16 sm:px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 transition-colors hover:bg-white/5 lg:hidden">
            <Menu size={20} className="text-white/70" />
          </button>
          <h1 className="flex-1 text-sm font-semibold text-white sm:text-base">{SECTION_LABELS[section]}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 md:flex">
              <Monitor size={13} /> {viewport}
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Ao vivo
            </span>
            <div className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">A</div>
          </div>
        </header>

        <main className="flex-1 bg-[#0f1117] p-4 sm:p-6">
          {section === 'dashboard' && <DashboardSection products={products} orders={orders} revenue={revenue} onNavigate={navigate} />}
          {section === 'products' && (
            <ProductsSection
              products={products}
              categories={categories}
              showForm={showForm}
              saving={saving}
              form={prodForm}
              image={prodImage}
              additionalImages={prodAdditionalImages}
              desc={prodDesc}
              upsellIds={prodUpsellIds}
              newCategoryName={newCategoryName}
              editingProductId={editingProductId}
              onToggleForm={() => setShowForm(f => !f)}
              onEditProduct={startEditProduct}
              onFormChange={(k, v) => setProdForm(f => ({ ...f, [k]: v }))}
              onImageChange={setProdImage}
              onAdditionalImagesChange={setProdAdditionalImages}
              onDescChange={setProdDesc}
              onUpsellChange={setProdUpsellIds}
              onNewCategoryNameChange={setNewCategoryName}
              onCreateCategory={addCategory}
              onMoveCategory={moveCategory}
              onSaveCategoryMedia={saveCategoryMedia}
              onDeleteCategory={deleteCategory}
              onSubmit={addProduct}
              onDelete={deleteProduct}
              onMove={moveProduct}
            />
          )}
          {section === 'orders' && <OrdersSection orders={orders} onUpdateTracking={updateTracking} />}
          {section === 'tracking' && <TrackingSection />}
          {section === 'automation' && <AutomationSection />}
          {section === 'settings' && (
            <SettingsSection
              categories={categories}
              newCategoryName={newCategoryName}
              onNewCategoryNameChange={setNewCategoryName}
              onCreateCategory={addCategory}
              onMoveCategory={moveCategory}
              onSaveCategoryMedia={saveCategoryMedia}
              onDeleteCategory={deleteCategory}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardSection({ products, orders, revenue, onNavigate }: { products: Product[]; orders: Order[]; revenue: number; onNavigate: (s: Section) => void; }) {
  const stats = [
    { label: 'Produtos', value: products.length, sub: 'cadastrados', icon: <Package size={20} className="text-green-500" />, bg: 'bg-green-500/10' },
    { label: 'Pedidos', value: orders.length, sub: `${orders.filter(o => o.status === 'pending').length} aguardando`, icon: <ShoppingCart size={20} className="text-blue-400" />, bg: 'bg-blue-500/10' },
    { label: 'Receita', value: `€${revenue.toFixed(2)}`, sub: 'total', icon: <Euro size={20} className="text-amber-400" />, bg: 'bg-amber-500/10' },
    { label: 'Em trânsito', value: orders.filter(o => o.status === 'shipped').length, sub: 'enviados', icon: <Truck size={20} className="text-purple-400" />, bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-5 text-white">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1d27] p-4 shadow-none sm:gap-4 sm:p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
            <div className="min-w-0">
              <div className="truncate text-lg font-bold sm:text-xl">{s.value}</div>
              <div className="truncate text-xs text-white/60 sm:text-sm">{s.label}</div>
              <div className="truncate text-xs text-white/40">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <TableCard title="Últimos Pedidos" icon={<ShoppingCart size={15} className="text-green-500" />} action={{ label: 'Ver todos', onClick: () => onNavigate('orders') }}>
        <table className="w-full text-sm">
          <thead className="bg-[#0f1117]">
            <tr>{['#', 'Cliente', 'Produto', 'Total', 'Status'].map(h => (
              <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {orders.slice(0, 5).map(o => (
              <tr key={o.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-white/50">#{o.id}</td>
                <td className="px-4 py-3 font-medium text-white">{o.customer}</td>
                <td className="max-w-[120px] truncate px-4 py-3 text-white/70">{o.product}</td>
                <td className="px-4 py-3 font-semibold text-white">€{(o.total ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-white/45">Nenhum pedido ainda</td></tr>}
          </tbody>
        </table>
      </TableCard>

      <TableCard title="Produtos" icon={<Package size={15} className="text-green-500" />} action={{ label: 'Gerenciar', onClick: () => onNavigate('products') }}>
        <table className="w-full text-sm">
          <thead className="bg-[#0f1117]">
            <tr>{['Produto', 'Categoria', 'Preço', 'Estoque'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/50">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.map(p => (
              <tr key={p.id} className="transition-colors hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">{p.category || '—'}</span></td>
                <td className="px-4 py-3 font-semibold text-green-400">€{(p.price ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold ${(p.stock ?? 0) > 10 ? 'text-green-400' : (p.stock ?? 0) > 0 ? 'text-amber-400' : 'text-red-400'}`}>{p.stock ?? 0} un.</span></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-white/45">Nenhum produto ainda</td></tr>}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

// ─── Tracking ─────────────────────────────────────────────────────────────────

function TrackingSection() {
  const [code, setCode] = useState('');

  return (
    <div className="max-w-lg rounded-2xl border border-white/10 bg-[#1a1d27] p-5 text-white shadow-none sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-white">
        <Truck size={16} className="text-green-500" />Rastrear Envio
      </h2>
      <p className="mb-4 text-sm text-white/60">Consulte o estado de qualquer envio pelo código de rastreio.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.trim())}
          placeholder="Ex: ES123456789ES"
          onKeyDown={e => { if (e.key==='Enter' && code) window.open(`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}`,'_blank'); }}
          className="flex-1 rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
        />
        <a
          href={code ? `https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}` : undefined}
          target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors
            ${code ? 'hover:bg-green-700 cursor-pointer' : 'opacity-40 pointer-events-none'}`}>
          <ExternalLink size={14} />Rastrear
        </a>
      </div>
      <p className="mt-3 text-xs text-white/40">Via Correos de España</p>
    </div>
  );
}

// ─── Automation ───────────────────────────────────────────────────────────────

type Supplier = {
  id: number;
  name: string;
  base_url: string;
  api_key?: string;
  active: boolean;
  scraper_url_template?: string;
  scraper_stock_selector?: string;
};

type AutomationSettings = {
  automation_enabled: boolean;
  whatsapp_provider: string;
  whatsapp_url: string;
  whatsapp_token: string;
  sendgrid_key: string;
  notify_email: string;
  notify_whatsapp: boolean;
  notify_email_enabled: boolean;
};

function AutomationSection() {
  const [tab, setTab] = useState<'suppliers' | 'scraper' | 'import' | 'config'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [settings, setSettings] = useState<Partial<AutomationSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New supplier form
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newKey, setNewKey] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(false);

  useEffect(() => {
    (async () => {
      const [sr, ar] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/automation-settings'),
      ]);
      if (sr.ok) setSuppliers(await sr.json());
      if (ar.ok) setSettings(await ar.json());
      setLoading(false);
    })();
  }, []);

  async function addSupplier() {
    if (!newName || !newUrl) return;
    setAddingSupplier(true);
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, baseUrl: newUrl, apiKey: newKey }),
    });
    if (res.ok) {
      const s = await res.json();
      setSuppliers(prev => [...prev, s]);
      setNewName(''); setNewUrl(''); setNewKey('');
    }
    setAddingSupplier(false);
  }

  async function toggleSupplier(id: number, active: boolean) {
    await fetch('/api/suppliers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, active: !active } : s));
  }

  async function deleteSupplier(id: number) {
    await fetch('/api/suppliers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }

  async function saveSettings() {
    setSaving(true);
    await fetch('/api/automation-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automationEnabled: settings.automation_enabled,
        whatsappProvider: settings.whatsapp_provider,
        whatsappUrl: settings.whatsapp_url,
        whatsappToken: settings.whatsapp_token,
        sendgridKey: settings.sendgrid_key,
        notifyEmail: settings.notify_email,
        notifyWhatsapp: settings.notify_whatsapp,
        notifyEmailEnabled: settings.notify_email_enabled,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Zap size={18} className="text-amber-500" /> Automação Dropshipping
            </h2>
            <p className="mt-0.5 text-sm text-white/60">
              Verificação de estoque, pedidos automáticos e notificações ao cliente
            </p>
          </div>
          {/* Master toggle */}
          <button
            onClick={() => setSettings(p => ({ ...p, automation_enabled: !p.automation_enabled }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${settings.automation_enabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
          >
            {settings.automation_enabled
              ? <><ToggleRight size={18} /> Automação ON</>
              : <><ToggleLeft  size={18} /> Automação OFF</>}
          </button>
        </div>

        {/* Pipeline visual */}
        <div className="mt-5 flex items-center gap-1 flex-wrap overflow-x-auto text-xs text-white/50">
          {[
            { icon: <ShoppingCart size={13} />, label: 'Compra' },
            { icon: <Globe size={13} />,        label: 'Estoque' },
            { icon: <Package size={13} />,      label: 'Pedido' },
            { icon: <Truck size={13} />,        label: 'Envio' },
            { icon: <MessageCircle size={13} />,label: 'WhatsApp' },
            { icon: <Mail size={13} />,         label: 'E-mail' },
          ].map((step, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`flex items-center gap-1 rounded-full px-2 py-1
                ${settings.automation_enabled ? 'bg-green-500/10 text-green-300' : 'bg-white/5 text-white/40'}`}>
                {step.icon}{step.label}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} className="text-white/20" />}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'suppliers', label: 'Fornecedores (API)' },
          { key: 'scraper',   label: 'Sem Key (Scraper)' },
          { key: 'import',    label: 'Importar Produtos' },
          { key: 'config',    label: 'WhatsApp & Email'  },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.key ? 'bg-green-600 text-white' : 'bg-[#1a1d27] text-white/60 border border-white/10 hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="space-y-4">
          {/* Add supplier form */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
            <h3 className="mb-4 flex items-center gap-2 font-medium text-white">
              <Plus size={15} className="text-green-500" /> Adicionar Fornecedor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                placeholder="Nome do fornecedor"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                placeholder="Base URL da API"
                value={newUrl} onChange={e => setNewUrl(e.target.value)}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                placeholder="API Key (opcional)"
                value={newKey} onChange={e => setNewKey(e.target.value)}
              />
            </div>
            <button
              onClick={addSupplier}
              disabled={addingSupplier || !newName || !newUrl}
              className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {addingSupplier ? 'Adicionando…' : 'Adicionar Fornecedor'}
            </button>
          </div>

          {/* Supplier list */}
          {suppliers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#1a1d27] p-8 text-center text-sm text-white/45">
              Nenhum fornecedor cadastrado. Adicione um acima.
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers.map(s => (
                <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-[#1a1d27] p-4 shadow-none">
                  <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="truncate text-xs text-white/45">{s.base_url}</p>
                    {s.api_key && (
                      <p className="font-mono text-xs text-white/40">
                        key: {s.api_key.slice(0, 8)}•••
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSupplier(s.id, s.active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                        ${s.active ? 'bg-green-500/10 text-green-300 hover:bg-green-500/20' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                    >
                      {s.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => deleteSupplier(s.id)}
                      className="rounded-lg p-1.5 text-red-300 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Webhook info */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <Globe size={14} className="text-amber-300" /> Webhook de rastreio do fornecedor
            </p>
            <p className="mt-2 break-all rounded border border-amber-500/20 bg-[#0f1117] px-3 py-2 font-mono text-xs text-amber-100/90">
              POST https://vitafitstore.vercel.app/api/webhook/tracking
            </p>
            <p className="mt-2 text-xs text-amber-200/80">
              Body: <code className="font-mono">{'{ "fornecedor_pedido_id": "ID", "codigo_rastreio": "AA000000000BR", "transportadora": "Correios" }'}</code>
            </p>
          </div>
        </div>
      )}

      {tab === 'scraper' && (
        <ScraperTab suppliers={suppliers} onSaveSupplier={async (id: number, scraperUrlTemplate: string, scraperStockSelector: string) => {
          const res = await fetch('/api/suppliers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, scraperUrlTemplate, scraperStockSelector }),
          });
          if (res.ok) {
            const updated = await res.json();
            setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
          }
        }} />
      )}

      {tab === 'import' && (
        <ImportTab onImportDone={() => { /* reload products outside scope */ }} />
      )}

      {tab === 'config' && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
          {/* WhatsApp */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium text-white">
              <MessageCircle size={15} className="text-green-500" /> WhatsApp
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-32 text-sm text-white/60">Provider</span>
                <select
                  value={settings.whatsapp_provider ?? 'zapi'}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_provider: e.target.value }))}
                  className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                >
                  <option value="zapi">Z-API (pago)</option>
                  <option value="evolution">Evolution API (open-source)</option>
                </select>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-white/60">
                  {settings.whatsapp_provider === 'evolution'
                    ? 'Evolution API URL (ex: http://localhost:8080)'
                    : 'Z-API URL (ex: https://api.z-api.io/instances/ID/token/TOKEN)'}
                </span>
                <input
                  className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                  placeholder="https://..."
                  value={settings.whatsapp_url ?? ''}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_url: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-white/60">
                  {settings.whatsapp_provider === 'evolution' ? 'API Key' : 'Client-Token'}
                </span>
                <input
                  type="password"
                  className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                  placeholder="Token secreto"
                  value={settings.whatsapp_token ?? ''}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_token: e.target.value }))}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={settings.notify_whatsapp ?? true}
                  onChange={e => setSettings(p => ({ ...p, notify_whatsapp: e.target.checked }))}
                  className="w-4 h-4 accent-green-600"
                />
                Enviar notificações por WhatsApp
              </label>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Email */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium text-white">
              <Mail size={15} className="text-blue-400" /> E-mail (SendGrid)
            </h3>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-white/60">SendGrid API Key</span>
                <input
                  type="password"
                  className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
                  placeholder="SG.xxxxxxxxxxxx"
                  value={settings.sendgrid_key ?? ''}
                  onChange={e => setSettings(p => ({ ...p, sendgrid_key: e.target.value }))}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={settings.notify_email_enabled ?? false}
                  onChange={e => setSettings(p => ({ ...p, notify_email_enabled: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                Enviar notificações por e-mail
              </label>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar Configurações'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Scraper Tab ─────────────────────────────────────────────────────────────

function ScraperTab({
  suppliers,
  onSaveSupplier,
}: {
  suppliers: Supplier[];
  onSaveSupplier: (id: number, urlTpl: string, selector: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [urlTpl, setUrlTpl]     = useState('');
  const [selector, setSelector] = useState('');
  const [testUrl, setTestUrl]   = useState('');
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ stock: number | null; priceRaw: string | null; error?: string } | null>(null);
  const [saving, setSaving]     = useState(false);

  function openSupplier(s: Supplier) {
    setExpanded(s.id);
    setUrlTpl(s.scraper_url_template ?? '');
    setSelector(s.scraper_stock_selector ?? '');
    setTestUrl('');
    setTestResult(null);
  }

  async function runTest() {
    if (!testUrl || !selector) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch('/api/suppliers/scrape-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testUrl, stockSelector: selector }),
    });
    const data = await res.json();
    setTestResult(res.ok ? { stock: data.stock, priceRaw: data.priceRaw } : { stock: null, priceRaw: null, error: data.error });
    setTesting(false);
  }

  async function save(id: number) {
    setSaving(true);
    await onSaveSupplier(id, urlTpl, selector);
    setSaving(false);
    setExpanded(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
        <p className="mb-1 font-medium">🤖 Scraper — fornecedores sem API</p>
        <p>Configure a URL do produto (use <code className="rounded bg-[#0f1117] px-1 font-mono">{'{sku}'}</code> como placeholder) e o seletor CSS do elemento que mostra o estoque. O robô vai buscar o HTML e extrair o número automaticamente.</p>
        <p className="mt-1 text-xs text-cyan-200/70">Suporte: <code className="font-mono">#id</code>, <code className="font-mono">.classe</code>, <code className="font-mono">tag.classe</code>, <code className="font-mono">[data-attr]</code></p>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#1a1d27] p-8 text-center text-sm text-white/45">
          Cadastre fornecedores na aba "Fornecedores (API)" primeiro.
        </div>
      ) : (
        suppliers.map(s => (
          <div key={s.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d27] shadow-none">
            <button
              onClick={() => { setExpanded(expanded === s.id ? null : s.id); openSupplier(s); }}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${s.scraper_url_template ? 'bg-cyan-400' : 'bg-white/20'}`} />
                <span className="text-sm font-medium text-white">{s.name}</span>
                {s.scraper_url_template && (
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200">scraper ativo</span>
                )}
              </div>
              <ChevronRight size={16} className={`text-white/30 transition-transform ${expanded === s.id ? 'rotate-90' : ''}`} />
            </button>

            {expanded === s.id && (
              <div className="space-y-3 border-t border-white/10 p-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-white/60">URL do Produto (com {'{sku}'})</span>
                  <input
                    className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder="https://fornecedor.com/produto/{sku}"
                    value={urlTpl}
                    onChange={e => setUrlTpl(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-white/60">Seletor CSS do Estoque</span>
                  <input
                    className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder=".quantidade-estoque ou #stock ou [data-stock]"
                    value={selector}
                    onChange={e => setSelector(e.target.value)}
                  />
                </label>

                {/* Test area */}
                <div className="space-y-2 rounded-lg bg-white/5 p-3">
                  <p className="text-xs font-medium text-white/60">Testar com URL real</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="Cole a URL de um produto para testar"
                      value={testUrl}
                      onChange={e => setTestUrl(e.target.value)}
                    />
                    <button
                      onClick={runTest}
                      disabled={testing || !testUrl || !selector}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {testing ? <RefreshCw size={13} className="animate-spin" /> : <Globe size={13} />}
                      Testar
                    </button>
                  </div>
                  {testResult && (
                    <div className={`rounded-lg px-3 py-2 text-sm ${testResult.error ? 'bg-red-500/10 text-red-200' : 'bg-green-500/10 text-green-200'}`}>
                      {testResult.error
                        ? `❌ Erro: ${testResult.error}`
                        : `✅ Estoque encontrado: ${testResult.stock ?? '(não numérico)'} unidades`
                      }
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => save(s.id)}
                    disabled={saving}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Salvando…' : 'Salvar Scraper'}
                  </button>
                  <button
                    onClick={() => setExpanded(null)}
                    className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Import Tab ───────────────────────────────────────────────────────────────

type ImportProduct = {
  sku: string;
  name: string;
  category: string;
  cost: number;
  salePrice: number;
  stock: number;
  image: string;
  description: string;
};

function parseCSV(text: string): ImportProduct[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? line.split(',');
    const clean  = values.map(v => v.replace(/^"|"$/g, '').trim());
    const get    = (keys: string[]) => clean[keys.map(k => headers.indexOf(k)).find(i => i >= 0) ?? -1] ?? '';
    const cost   = parseFloat(get(['preco_custo', 'custo', 'cost', 'price'])) || 0;
    return {
      sku:         get(['sku', 'codigo', 'code', 'id']),
      name:        get(['nome', 'name', 'produto', 'product']),
      category:    get(['categoria', 'category', 'cat']) || 'Geral',
      cost,
      salePrice:   parseFloat(get(['preco_venda', 'preco', 'sale_price'])) || +(cost * 1.4).toFixed(2),
      stock:       parseInt(get(['estoque', 'stock', 'qty', 'quantidade'])) || 0,
      image:       get(['imagem', 'image', 'foto', 'img']),
      description: get(['descricao', 'description', 'desc']),
    };
  }).filter(p => p.name);
}

function ImportTab({ onImportDone }: { onImportDone: () => void }) {
  const [step, setStep]             = useState<'upload' | 'select' | 'done'>('upload');
  const [allProducts, setAllProducts] = useState<ImportProduct[]>([]);
  const [selected, setSelected]     = useState<Record<string, ImportProduct>>({});
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('todas');
  const [margin, setMargin]         = useState(40);
  const [importing, setImporting]   = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const categories = [...new Set(allProducts.map(p => p.category))];

  const filtered = allProducts.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
      (filterCat === 'todas' || p.category === filterCat)
    );
  });

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target?.result as string) ?? '';
      const parsed = parseCSV(text).map(p => ({
        ...p,
        salePrice: +(p.cost * (1 + margin / 100)).toFixed(2),
      }));
      setAllProducts(parsed);
      setSelected({});
      setStep('select');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function toggleProduct(p: ImportProduct) {
    setSelected(prev => {
      const next = { ...prev };
      if (next[p.sku || p.name]) delete next[p.sku || p.name];
      else next[p.sku || p.name] = p;
      return next;
    });
  }

  function selectAll()   { const m: Record<string, ImportProduct> = {}; filtered.forEach(p => m[p.sku || p.name] = p); setSelected(m); }
  function deselectAll() { setSelected({}); }

  function editPrice(key: string, val: string) {
    const num = parseFloat(val) || 0;
    setSelected(prev => ({ ...prev, [key]: { ...prev[key], salePrice: num } }));
    setAllProducts(prev => prev.map(p => (p.sku || p.name) === key ? { ...p, salePrice: num } : p));
  }

  function recalcMargin(m: number) {
    setMargin(m);
    setAllProducts(prev => prev.map(p => ({ ...p, salePrice: +(p.cost * (1 + m / 100)).toFixed(2) })));
  }

  async function confirmImport() {
    setImporting(true);
    const list = Object.values(selected);
    const res = await fetch('/api/products/import-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: list.map(p => ({
          name: p.name,
          price: p.salePrice,
          category: p.category,
          stock: p.stock,
          image: p.image || null,
          description: p.description || null,
        })),
      }),
    });
    const data = await res.json();
    setImportedCount(data.imported ?? list.length);
    setImporting(false);
    setStep('done');
    onImportDone();
  }

  const selCount = Object.keys(selected).length;

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <div className="max-w-lg rounded-2xl border border-white/10 bg-[#1a1d27] p-6 shadow-none">
          <h3 className="mb-1 flex items-center gap-2 font-medium text-white">
            <Upload size={16} className="text-green-500" /> Importar Catálogo do Fornecedor
          </h3>
          <p className="mb-4 text-sm text-white/55">Carregue um arquivo CSV com os produtos. Colunas reconhecidas: <span className="font-mono text-xs text-white/75">nome, preco_custo, estoque, categoria, imagem, sku</span></p>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 p-8 transition-colors hover:border-green-500/40 hover:bg-white/5">
            <Upload size={28} className="mb-2 text-white/35" />
            <span className="text-sm text-white/70">Clique para selecionar o CSV</span>
            <span className="mt-1 text-xs text-white/40">Formato: .csv (UTF-8)</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
            />
          </label>

          <div className="mt-4">
            <label className="mb-1 flex items-center justify-between text-sm text-white/60">
              <span>Margem de lucro padrão</span>
              <strong className="text-green-400">{margin}%</strong>
            </label>
            <input
              type="range" min={5} max={200} value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
        </div>

        <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
          <p className="mb-1 font-medium text-white/80">Exemplo de CSV aceito:</p>
          <pre className="overflow-x-auto rounded border border-white/10 bg-[#0f1117] p-2 font-mono">{`sku,nome,preco_custo,estoque,categoria,imagem\nWHEY001,Whey Protein 1kg,89.90,42,Proteínas,https://...\nCREA001,Creatina 300g,45.00,18,Performance,https://...`}</pre>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-md rounded-2xl border border-white/10 bg-[#1a1d27] p-10 text-center shadow-none">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
        <h3 className="mb-1 text-lg font-semibold text-white">Importação concluída!</h3>
        <p className="text-sm text-white/55">{importedCount} produtos adicionados à sua loja.</p>
        <button
          onClick={() => { setStep('upload'); setAllProducts([]); setSelected({}); }}
          className="mt-5 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Importar mais
        </button>
      </div>
    );
  }

  // step === 'select'
  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1d27] p-4 shadow-none">
        <input
          className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none"
        >
          <option value="todas">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span>Margem:</span>
          <input
            type="number" min={0} max={500} value={margin}
            onChange={e => recalcMargin(Number(e.target.value))}
            className="w-16 rounded-lg border border-white/10 bg-[#22263a] px-2 py-1 text-center text-sm text-white outline-none"
          />
          <span>%</span>
        </div>
        <button onClick={selectAll} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs transition-colors hover:bg-white/10">Todos</button>
        <button onClick={deselectAll} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs transition-colors hover:bg-white/10">Nenhum</button>
        <span className="text-xs text-white/40">{filtered.length} produtos</span>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(p => {
          const key  = p.sku || p.name;
          const isSel = !!selected[key];
          const selP  = selected[key] ?? p;
          const profit = selP.salePrice - p.cost;
          return (
            <div
              key={key}
              onClick={() => toggleProduct(p)}
              className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all
                ${isSel ? 'border-green-500 bg-white/5 shadow-none' : 'border-white/10 bg-[#1a1d27] hover:border-white/20'}`}
            >
              {/* Checkbox badge */}
              <div className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold z-10
                ${isSel ? 'bg-green-500' : 'bg-white/10 border border-white/10 text-white/40'}`}>
                {isSel ? '✓' : ''}
              </div>

              {/* Image */}
              <div className="aspect-square bg-[#11131a]">
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f1f5f9"/><text x="40" y="44" text-anchor="middle" fill="%2394a3b8" font-size="24">📦</text></svg>')} />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                }
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-medium leading-tight text-white">{p.name}</p>
                <p className="mt-0.5 text-xs text-white/40">{p.category}</p>

                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs text-white/55">Custo: <span className="font-mono text-white/80">R${p.cost.toFixed(2)}</span></p>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <span className="text-xs text-white/60">Venda:</span>
                    <input
                      type="number"
                      value={isSel ? selP.salePrice : p.salePrice}
                      onChange={e => { if (!isSel) toggleProduct(p); editPrice(key, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="w-full rounded border border-white/10 bg-[#22263a] px-1 py-0.5 text-xs font-mono text-white outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/40"
                    />
                  </div>
                  <p className={`text-xs font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    Lucro: R${profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40">📦 {p.stock} un.</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border-t border-white/10 bg-[#11131a]/95 p-4 shadow-none backdrop-blur">
        <span className="text-sm text-white/60">
          {selCount > 0
            ? <span className="font-medium text-green-300">✅ {selCount} produto(s) selecionado(s)</span>
            : 'Clique nos cards para selecionar'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('upload')}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
          >
            ← Voltar
          </button>
          <button
            onClick={confirmImport}
            disabled={selCount === 0 || importing}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Importando…' : `Importar ${selCount} produto(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────


function SettingsSection({
  categories,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  onMoveCategory,
  onSaveCategoryMedia,
  onDeleteCategory,
}: {
  categories: Category[];
  newCategoryName: string;
  onNewCategoryNameChange: (v: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: number, direction: 'up' | 'down') => void;
  onSaveCategoryMedia: (id: number, bannerType: 'image' | 'video', bannerUrl: string, logoUrl: string) => void;
  onDeleteCategory: (id: number, name: string) => void;
}) {
  type HomeBlock = {
    key: 'hero' | 'trust' | 'products' | 'pin' | 'newsletter';
    label: string;
    position: number;
    enabled: boolean;
  };

  const [ig, setIg] = useState('');
  const [fb, setFb] = useState('');
  const [storeName, setStore] = useState('VitaFit Store');
  const [themeColor, setThemeColor] = useState('#10b981');
  const [logoUrl, setLogoUrl] = useState('');
  const [homeBlocks, setHomeBlocks] = useState<HomeBlock[]>([]);
  const [saved, setSaved] = useState(false);
  const blocosEditorRef = useRef<BlocosEditorHandle>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<number, { bannerType: 'image' | 'video'; bannerUrl: string; logoUrl: string }>>({});

  useEffect(() => {
    const next: Record<number, { bannerType: 'image' | 'video'; bannerUrl: string; logoUrl: string }> = {};
    for (const c of categories) {
      next[c.id] = {
        bannerType: c.bannerType === 'video' ? 'video' : 'image',
        bannerUrl: c.bannerUrl ?? '',
        logoUrl: c.logoUrl ?? '',
      };
    }
    setCategoryDrafts(next);
  }, [categories]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/store-settings');
        if (!res.ok) return;
        const data = await res.json();
        setStore(data?.storeName ?? 'VitaFit Store');
        setThemeColor(data?.themeColor ?? '#10b981');
        setLogoUrl(data?.logoUrl ?? '');
        setIg(data?.instagram ?? '');
        setFb(data?.facebook ?? '');
      } catch {
        // ignore load errors
      }
    })();

    (async () => {
      try {
        const res = await fetch('/api/home-blocks');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) setHomeBlocks(data);
      } catch {
        // ignore block load errors
      }
    })();
  }, []);

  function readFileAsDataURL(file: File, cb: (url: string) => void) {
    const r = new FileReader();
    r.onload = e => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    const [settingsRes] = await Promise.all([
      fetch('/api/store-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          themeColor,
          logoUrl,
          instagram: ig.trim(),
          facebook: fb.trim(),
        }),
      }),
      fetch('/api/home-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: blocosEditorRef.current?.getValue() ?? [] }),
      }),
    ]);

    if (settingsRes.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function saveBlocks(nextBlocks: HomeBlock[]) {
    setHomeBlocks(nextBlocks);
    await fetch('/api/home-blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: nextBlocks }),
    });
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= homeBlocks.length) return;

    const copy = [...homeBlocks];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;

    const normalized = copy.map((b, i) => ({ ...b, position: i + 1 }));
    void saveBlocks(normalized);
  }

  function toggleBlock(index: number) {
    const copy = [...homeBlocks];
    copy[index] = { ...copy[index], enabled: !copy[index].enabled };
    void saveBlocks(copy);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h2 className="mb-1 font-semibold text-white">Categorias da Loja</h2>
        <p className="mb-4 text-xs text-white/50">Crie categorias, organize a ordem e configure banner/logo dos cards da vitrine.</p>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => onNewCategoryNameChange(e.target.value)}
            placeholder="Ex: Suplementos"
            className="flex-1 rounded-xl border border-white/10 bg-[#22263a] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40"
          />
          <button
            type="button"
            onClick={onCreateCategory}
            className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            Criar categoria
          </button>
        </div>

        <div className="space-y-3">
          {categories.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">Crie categorias para liberar a edição de banner e logo.</div>
          )}
          {categories.map((c, idx) => {
            const draft = categoryDrafts[c.id] ?? { bannerType: 'image' as const, bannerUrl: '', logoUrl: '' };
            return (
              <div key={c.id} className="space-y-3 rounded-2xl border border-white/10 bg-[#0f1117] p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">{idx + 1}</span>
                  <span className="flex-1 text-sm font-semibold text-white">{c.name}</span>
                  <button type="button" onClick={() => onMoveCategory(c.id, 'up')} className="rounded-lg border border-white/15 p-2 text-white/70 hover:bg-white/10" title="Subir categoria"><ArrowUp size={12} /></button>
                  <button type="button" onClick={() => onMoveCategory(c.id, 'down')} className="rounded-lg border border-white/15 p-2 text-white/70 hover:bg-white/10" title="Descer categoria"><ArrowDown size={12} /></button>
                  <button type="button" onClick={() => onDeleteCategory(c.id, c.name)} className="rounded-lg border border-red-500/40 p-2 text-red-300 hover:bg-red-500/15" title="Excluir categoria"><Trash2 size={12} /></button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    value={draft.bannerType}
                    onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, bannerType: e.target.value === 'video' ? 'video' : 'image' } }))}
                    className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="image">Banner imagem</option>
                    <option value="video">Banner vídeo</option>
                  </select>
                  <input
                    type="text"
                    value={draft.bannerUrl}
                    onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, bannerUrl: e.target.value } }))}
                    placeholder="URL do banner (img/video)"
                    className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white placeholder:text-white/35 outline-none sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={draft.logoUrl}
                    onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: { ...draft, logoUrl: e.target.value } }))}
                    placeholder="URL da logo da categoria (opcional)"
                    className="rounded-xl border border-white/10 bg-[#22263a] px-3 py-2 text-xs text-white placeholder:text-white/35 outline-none sm:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveCategoryMedia(c.id, draft.bannerType, draft.bannerUrl, draft.logoUrl)}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Salvar mídia
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h2 className="mb-4 font-semibold text-white">Informações da Loja</h2>

        <label className="mb-1.5 block text-xs font-medium text-white/50">Nome da loja</label>
        <input type="text" value={storeName} onChange={e => setStore(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40" />

        <label className="mb-1.5 block text-xs font-medium text-white/50">Cor principal da loja</label>
        <div className="flex items-center gap-3 mb-4">
          <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
          <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40" />
        </div>

        <label className="mb-1.5 block text-xs font-medium text-white/50">Logo da loja</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) readFileAsDataURL(f, setLogoUrl);
          }}
          className="mb-3 w-full text-sm text-white/70"
        />
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-14 w-auto rounded border border-white/10 object-contain p-1" />}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h2 className="mb-4 font-semibold text-white">Redes Sociais</h2>
        <div className="space-y-4">
          {[{label:'Instagram',value:ig,setter:setIg,ph:'@vitafit'},{label:'Facebook',value:fb,setter:setFb,ph:'VitaFit'}].map(f => (
            <div key={f.label}>
              <label className="mb-1.5 block text-xs font-medium text-white/50">{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.ph}
                className="w-full rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h2 className="mb-4 font-semibold text-white">Blocos da Home (Fase 2)</h2>
        <BlocosEditor ref={blocosEditorRef} />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <Check size={15} />Salvar configurações
        </button>
        {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><Check size={14} />Salvo!</span>}
      </div>
    </form>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Order['status'] }) {
  const map = {
    pending:   { label: 'Aguardando', className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' },
    shipped:   { label: 'Enviado',    className: 'bg-blue-500/10 text-blue-300 border border-blue-500/20'  },
    delivered: { label: 'Entregue',   className: 'bg-green-500/10 text-green-300 border border-green-500/20' },
  } as const;
  const { label, className } = map[status] ?? map.pending;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

function TableCard({ title, icon, action, children }: {
  title: string; icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d27] shadow-none">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">{icon}{title}</h2>
        {action && (
          <button onClick={action.onClick}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-green-400 transition-colors hover:text-green-300">
            {action.label}<ChevronRight size={13} />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
