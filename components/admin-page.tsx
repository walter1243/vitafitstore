'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Settings,
  Menu, X, Plus, Trash2, ExternalLink, Check, Euro,
  ChevronRight, Upload, Video, AlertCircle, CheckCircle2,
  ArrowUp, ArrowDown, Monitor,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'dashboard' | 'products' | 'orders' | 'tracking' | 'settings';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  video?: string;
  description?: string;
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
  settings: 'Configurações',
};

// ─── Root component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [section, setSection]       = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts]     = useState<Product[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [viewport, setViewport]     = useState('—');
  let toastId = useRef(0);

  // Product form
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [prodForm, setProdForm]     = useState({
    name: '', price: '', category: '', stock: '', video: '',
  });
  const [prodImage, setProdImage]   = useState<string | null>(null);
  const [prodDesc, setProdDesc]     = useState('');

  const addToast = useCallback((type: Toast['type'], msg: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const updateViewport = () => setViewport(`${window.innerWidth}x${window.innerHeight}px`);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  async function fetchData() {
    try {
      const [pr, or] = await Promise.all([fetch('/api/products'), fetch('/api/orders')]);
      if (pr.ok) setProducts(await pr.json());
      if (or.ok) setOrders(await or.json());
    } catch { /* silently ignore — DB might not be configured yet */ }
  }

  async function addProduct() {
    if (!prodForm.name.trim()) { addToast('error', 'Nome do produto é obrigatório.'); return; }
    if (!prodForm.price)        { addToast('error', 'Preço é obrigatório.');          return; }

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        prodForm.name.trim(),
          price:       parseFloat(prodForm.price),
          category:    prodForm.category.trim(),
          stock:       parseInt(prodForm.stock) || 0,
          video:       prodForm.video.trim() || null,
          description: prodDesc || null,
          image:       prodImage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProducts(p => [data, ...p]);
        setProdForm({ name: '', price: '', category: '', stock: '', video: '' });
        setProdImage(null);
        setProdDesc('');
        setShowForm(false);
        addToast('success', `"${data.name}" cadastrado com sucesso!`);
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
    else        addToast('error', 'Falha ao remover produto.');
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
    else        addToast('error', 'Falha ao actualizar rastreio.');
  }

  const revenue      = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  function navigate(s: Section) {
    setSection(s);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  const navItems: { key: Section; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'dashboard',  label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
    { key: 'products',   label: 'Produtos',        icon: <Package size={18} /> },
    { key: 'orders',     label: 'Pedidos',         icon: <ShoppingCart size={18} />, badge: pendingCount || undefined },
    { key: 'tracking',   label: 'Rastreio',        icon: <Truck size={18} /> },
    { key: 'settings',   label: 'Configurações',   icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">

      {/* ── Toasts ──────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto
              animate-in slide-in-from-right-4 fade-in duration-200
              ${t.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'}`}
          >
            {t.type === 'success'
              ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              : <AlertCircle  size={18} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="cursor-pointer shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0`}>

        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center font-bold text-lg shrink-0">V</div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">VitaFit Admin</div>
            <div className="text-[11px] text-white/40">Painel de Controle</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 rounded cursor-pointer text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-5 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Menu</div>
          {navItems.map(item => (
            <button key={item.key} onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm cursor-pointer transition-colors border-l-2
                ${section === item.key
                  ? 'bg-white/10 text-white border-green-500'
                  : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white'}`}>
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/30 text-center shrink-0">
          VitaFit © 2025
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer lg:hidden">
            <Menu size={20} className="text-slate-600" />
          </button>
          <h1 className="flex-1 font-semibold text-slate-800 text-sm sm:text-base">{SECTION_LABELS[section]}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <Monitor size={13} /> {viewport}
            </span>
            <span className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Ao vivo
            </span>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none">A</div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {section === 'dashboard' && (
            <DashboardSection products={products} orders={orders} revenue={revenue} onNavigate={navigate} />
          )}
          {section === 'products' && (
            <ProductsSection
              products={products}
              showForm={showForm}
              saving={saving}
              form={prodForm}
              image={prodImage}
              desc={prodDesc}
              onToggleForm={() => setShowForm(f => !f)}
              onFormChange={(k, v) => setProdForm(f => ({ ...f, [k]: v }))}
              onImageChange={setProdImage}
              onDescChange={setProdDesc}
              onSubmit={addProduct}
              onDelete={deleteProduct}
              onMove={moveProduct}
            />
          )}
          {section === 'orders'   && <OrdersSection   orders={orders}   onUpdateTracking={updateTracking} />}
          {section === 'tracking' && <TrackingSection />}
          {section === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({ products, orders, revenue, onNavigate }: {
  products: Product[]; orders: Order[]; revenue: number; onNavigate: (s: Section) => void;
}) {
  const stats = [
    { label: 'Produtos',    value: products.length,                                  sub: 'cadastrados',  icon: <Package    size={20} className="text-green-600"  />, bg: 'bg-green-50'  },
    { label: 'Pedidos',     value: orders.length,                                    sub: `${orders.filter(o=>o.status==='pending').length} aguardando`, icon: <ShoppingCart size={20} className="text-blue-600"   />, bg: 'bg-blue-50'   },
    { label: 'Receita',     value: `€${revenue.toFixed(2)}`,                         sub: 'total',        icon: <Euro       size={20} className="text-amber-600" />, bg: 'bg-amber-50'  },
    { label: 'Em trânsito', value: orders.filter(o=>o.status==='shipped').length,    sub: 'enviados',     icon: <Truck      size={20} className="text-purple-600"/>, bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-bold text-slate-800 truncate">{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-500 truncate">{s.label}</div>
              <div className="text-xs text-slate-400 truncate">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <TableCard title="Últimos Pedidos" icon={<ShoppingCart size={15} className="text-slate-400" />} action={{ label: 'Ver todos', onClick: () => onNavigate('orders') }}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{['#','Cliente','Produto','Total','Status'].map(h => (
              <th key={h} className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.slice(0,5).map(o => (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 sm:px-5 py-3 font-mono text-xs text-slate-500">#{o.id}</td>
                <td className="px-4 sm:px-5 py-3 font-medium text-slate-700">{o.customer}</td>
                <td className="px-4 sm:px-5 py-3 text-slate-600 max-w-[120px] truncate">{o.product}</td>
                <td className="px-4 sm:px-5 py-3 font-semibold text-slate-800">€{(o.total??0).toFixed(2)}</td>
                <td className="px-4 sm:px-5 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum pedido ainda</td></tr>}
          </tbody>
        </table>
      </TableCard>

      <TableCard title="Produtos" icon={<Package size={15} className="text-slate-400" />} action={{ label: 'Gerenciar', onClick: () => onNavigate('products') }}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{['Produto','Categoria','Preço','Estoque'].map(h => (
              <th key={h} className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 sm:px-5 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 sm:px-5 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.category||'—'}</span></td>
                <td className="px-4 sm:px-5 py-3 font-semibold text-green-700">€{(p.price??0).toFixed(2)}</td>
                <td className="px-4 sm:px-5 py-3">
                  <span className={`text-xs font-semibold ${(p.stock??0)>20?'text-green-600':(p.stock??0)>5?'text-amber-600':'text-red-600'}`}>{p.stock??0} un.</span>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum produto ainda</td></tr>}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

function ProductsSection({ products, showForm, saving, form, image, desc,
  onToggleForm, onFormChange, onImageChange, onDescChange, onSubmit, onDelete, onMove }: {
  products: Product[];
  showForm: boolean;
  saving: boolean;
  form: { name: string; price: string; category: string; stock: string; video: string };
  image: string | null;
  desc: string;
  onToggleForm: () => void;
  onFormChange: (k: string, v: string) => void;
  onImageChange: (v: string | null) => void;
  onDescChange: (v: string) => void;
  onSubmit: () => void;
  onDelete: (id: number, name: string) => void;
  onMove: (id: number, direction: 'up' | 'down') => void;
}) {
  const dropRef    = useRef<HTMLDivElement>(null);
  const descRef    = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);

  // ── Image helpers ────────────────────────────────────────────
  function readFileAsDataURL(file: File, cb: (url: string) => void) {
    const r = new FileReader();
    r.onload = e => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) readFileAsDataURL(f, onImageChange);
  }

  // Ctrl+V on the upload area — capture image from clipboard
  function handleUploadPaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) { readFileAsDataURL(f, onImageChange); break; }
      }
    }
  }

  // Drag & drop on upload area
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) readFileAsDataURL(f, onImageChange);
  }

  // ── Description with embedded images (contentEditable) ──────
  function handleDescPaste(e: React.ClipboardEvent) {
    // If clipboard has an image, convert & insert inline
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const f = item.getAsFile();
        if (!f) continue;
        readFileAsDataURL(f, url => {
          // Insert <img> at cursor position inside contentEditable
          document.execCommand('insertHTML', false,
            `<img src="${url}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block;" />`
          );
          onDescChange(descRef.current?.innerHTML ?? '');
        });
        return;
      }
    }
    // Otherwise let normal paste proceed
  }

  const fields = [
    { k: 'name',     label: 'Nome *',       ph: 'Ex: Whey Protein 1kg',   type: 'text'   },
    { k: 'price',    label: 'Preço (€) *',  ph: '29.99',                  type: 'number' },
    { k: 'category', label: 'Categoria',    ph: 'Ex: Suplementos',        type: 'text'   },
    { k: 'stock',    label: 'Estoque (un.)',ph: '100',                    type: 'number' },
  ];

  return (
    <div className="space-y-5">
      {/* ── Form card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
            <Package size={16} className="text-slate-400 shrink-0" />
            {showForm ? 'Novo Produto' : 'Produtos'}
          </h2>
          <button onClick={onToggleForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap">
            {showForm ? <><X size={13} />Cancelar</> : <><Plus size={13} />Novo produto</>}
          </button>
        </div>

        {showForm && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {fields.map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.k as keyof typeof form]}
                    onChange={e => onFormChange(f.k, e.target.value)}
                    placeholder={f.ph}
                    step={f.type === 'number' ? '0.01' : undefined}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Video size={12} />URL do Vídeo (opcional)
              </label>
              <input
                type="url"
                value={form.video}
                onChange={e => onFormChange('video', e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou link MP4"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Description — contentEditable with inline image paste */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Descrição{' '}
                <span className="text-slate-400 font-normal">(Ctrl+V cola imagens inline)</span>
              </label>
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handleDescPaste}
                onInput={() => onDescChange(descRef.current?.innerHTML ?? '')}
                className="w-full min-h-[100px] px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors prose prose-sm max-w-none"
                style={{ lineHeight: '1.6' }}
                data-placeholder="Descrição, ingredientes, modo de uso, prova social... Cole imagens diretamente aqui."
              />
              <p className="text-xs text-slate-400 mt-1">Suporta texto + imagens coladas com Ctrl+V</p>
            </div>

            {/* Image upload — file, drag & drop, Ctrl+V */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Imagem Principal{' '}
                <span className="text-slate-400 font-normal">(arraste, clique ou Ctrl+V)</span>
              </label>
              <div
                ref={dropRef}
                tabIndex={0}
                onPaste={handleUploadPaste}
                onDragOver={e => { e.preventDefault(); setDrag(true);  }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-green-500/30
                  ${drag ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-green-400 hover:bg-green-50'}`}
              >
                <input
                  type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageFile}
                />
                <Upload size={22} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Arraste uma imagem aqui, clique para selecionar</p>
                <p className="text-xs text-slate-400 mt-1">ou pressione Ctrl+V para colar • JPG, PNG, WebP</p>
              </div>

              {image && (
                <div className="mt-3 relative inline-block">
                  <img src={image} alt="preview" className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  <button
                    onClick={() => onImageChange(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow">
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-1">
              <button
                onClick={onSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors cursor-pointer">
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
                {saving ? 'Cadastrando...' : 'Cadastrar Produto'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Products table ── */}
      <TableCard title={`Todos os produtos (${products.length})`} icon={<Package size={15} className="text-slate-400" />}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>{['Produto','Categoria','Preço','Estoque','Mover',''].map((h,i) => (
              <th key={i} className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 sm:px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Package size={15} className="text-slate-400" /></div>}
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-slate-400 truncate max-w-[180px]"
                          dangerouslySetInnerHTML={{ __html: p.description.replace(/<[^>]+>/g, ' ').slice(0,60) + '…' }} />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.category||'—'}</span>
                </td>
                <td className="px-4 sm:px-5 py-3 font-semibold text-green-700 whitespace-nowrap">€{(p.price??0).toFixed(2)}</td>
                <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                  <span className={`text-xs font-semibold ${(p.stock??0)>20?'text-green-600':(p.stock??0)>5?'text-amber-600':'text-red-600'}`}>
                    {p.stock??0} un.
                  </span>
                </td>
                <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMove(p.id, 'up')}
                      className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => onMove(p.id, 'down')}
                      className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </td>
                <td className="px-4 sm:px-5 py-3 text-right">
                  <button onClick={() => onDelete(p.id, p.name)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                    title="Remover">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">Nenhum produto cadastrado ainda</td></tr>
            )}
          </tbody>
        </table>
      </TableCard>
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
        <div key={o.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-bold text-slate-700 font-mono text-sm">#{o.id}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="text-xs text-slate-400">{o.date}</div>
            </div>
            <div className="font-bold text-lg text-slate-800">€{(o.total??0).toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div><div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Cliente</div><div className="text-slate-700 font-medium">{o.customer}</div></div>
            <div><div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Produto</div><div className="text-slate-600">{o.product}</div></div>
            <div><div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Contato</div><div className="text-slate-600">{o.customerEmail || '—'} {o.customerPhone ? `• ${o.customerPhone}` : ''}</div></div>
            <div className="sm:col-span-3"><div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Endereço</div><div className="text-slate-600">{o.addressLine || '—'} {o.postalCode ? `• ${o.postalCode}` : ''} {o.city ? `• ${o.city}` : ''} {o.country ? `• ${o.country}` : ''}</div></div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={inputs[o.id] ?? ''}
              onChange={e => setInputs(t => ({ ...t, [o.id]: e.target.value }))}
              placeholder="Código de rastreio (ex: ES123456789ES)"
              className="flex-1 min-w-[160px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
            />
            <button onClick={() => save(o.id)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
              <Check size={14} />Salvar
            </button>
            {o.tracking && (
              <a href={`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${o.tracking}`}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                <ExternalLink size={14} />Rastrear
              </a>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center text-slate-400 text-sm">
          Nenhum pedido encontrado
        </div>
      )}
    </div>
  );
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

function TrackingSection() {
  const [code, setCode] = useState('');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6 max-w-lg">
      <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Truck size={16} className="text-slate-400" />Rastrear Envio
      </h2>
      <p className="text-sm text-slate-500 mb-4">Consulte o estado de qualquer envio pelo código de rastreio.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.trim())}
          placeholder="Ex: ES123456789ES"
          onKeyDown={e => { if (e.key==='Enter' && code) window.open(`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}`,'_blank'); }}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
        />
        <a
          href={code ? `https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}` : undefined}
          target="_blank" rel="noopener noreferrer"
          className={`px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap
            ${code ? 'hover:bg-green-700 cursor-pointer' : 'opacity-40 pointer-events-none'}`}>
          <ExternalLink size={14} />Rastrear
        </a>
      </div>
      <p className="text-xs text-slate-400 mt-3">Via Correos de España</p>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsSection() {
  const [ig, setIg] = useState('');
  const [fb, setFb] = useState('');
  const [storeName, setStore] = useState('VitaFit Store');
  const [themeColor, setThemeColor] = useState('#10b981');
  const [logoUrl, setLogoUrl] = useState('');
  const [saved, setSaved] = useState(false);

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
  }, []);

  function readFileAsDataURL(file: File, cb: (url: string) => void) {
    const r = new FileReader();
    r.onload = e => cb(e.target?.result as string);
    r.readAsDataURL(file);
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    const res = await fetch('/api/store-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: storeName.trim(),
        themeColor,
        logoUrl,
        instagram: ig.trim(),
        facebook: fb.trim(),
      }),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Informações da Loja</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome da loja</label>
        <input type="text" value={storeName} onChange={e => setStore(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors mb-4" />

        <label className="block text-xs font-medium text-slate-500 mb-1.5">Cor principal da loja</label>
        <div className="flex items-center gap-3 mb-4">
          <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
          <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors" />
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1.5">Logo da loja</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) readFileAsDataURL(f, setLogoUrl);
          }}
          className="w-full text-sm mb-3"
        />
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain rounded border border-slate-200 p-1" />}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Redes Sociais</h2>
        <div className="space-y-4">
          {[{label:'Instagram',value:ig,setter:setIg,ph:'@vitafit'},{label:'Facebook',value:fb,setter:setFb,ph:'VitaFit'}].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.ph}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors" />
            </div>
          ))}
        </div>
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
    pending:   { label: 'Aguardando', className: 'bg-amber-100 text-amber-700' },
    shipped:   { label: 'Enviado',    className: 'bg-blue-100  text-blue-700'  },
    delivered: { label: 'Entregue',   className: 'bg-green-100 text-green-700' },
  } as const;
  const { label, className } = map[status] ?? map.pending;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>;
}

function TableCard({ title, icon, action, children }: {
  title: string; icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">{icon}{title}</h2>
        {action && (
          <button onClick={action.onClick}
            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer font-medium transition-colors">
            {action.label}<ChevronRight size={13} />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
