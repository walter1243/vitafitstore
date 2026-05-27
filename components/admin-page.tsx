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
  settings: 'Configurações',
};

// ─── Root component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [section, setSection]       = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [newCategoryName, setNewCategoryName] = useState('');

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
      const [pr, or, cr] = await Promise.all([fetch('/api/products'), fetch('/api/orders'), fetch('/api/categories')]);
      if (pr.ok) setProducts(await pr.json());
      if (or.ok) setOrders(await or.json());
      if (cr.ok) setCategories(await cr.json());
    } catch { /* silently ignore — DB might not be configured yet */ }
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
      body: JSON.stringify({
        action: 'updateMedia',
        id,
        bannerType,
        bannerUrl,
        logoUrl,
      }),
    });

    if (res.ok) {
      await fetchData();
      addToast('success', 'Mídia da categoria atualizada.');
    } else {
      const data = await res.json().catch(() => ({}));
      addToast('error', data?.error ?? 'Falha ao salvar mídia da categoria.');
    }
  }

  async function addProduct() {
    if (!prodForm.name.trim()) { addToast('error', 'Nome do produto é obrigatório.'); return; }
    if (!prodForm.price)        { addToast('error', 'Preço é obrigatório.');          return; }
    if (!prodForm.category.trim()) { addToast('error', 'Selecione uma categoria.'); return; }

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
    { key: 'dashboard',   label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
    { key: 'products',    label: 'Produtos',        icon: <Package size={18} /> },
    { key: 'orders',      label: 'Pedidos',         icon: <ShoppingCart size={18} />, badge: pendingCount || undefined },
    { key: 'tracking',    label: 'Rastreio',        icon: <Truck size={18} /> },
    { key: 'automation',  label: 'Automação',       icon: <Zap size={18} /> },
    { key: 'settings',    label: 'Configurações',   icon: <Settings size={18} /> },
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
              categories={categories}
              showForm={showForm}
              saving={saving}
              form={prodForm}
              image={prodImage}
              desc={prodDesc}
              newCategoryName={newCategoryName}
              onToggleForm={() => setShowForm(f => !f)}
              onFormChange={(k, v) => setProdForm(f => ({ ...f, [k]: v }))}
              onImageChange={setProdImage}
              onDescChange={setProdDesc}
              onNewCategoryNameChange={setNewCategoryName}
              onCreateCategory={addCategory}
              onMoveCategory={moveCategory}
              onSaveCategoryMedia={saveCategoryMedia}
              onSubmit={addProduct}
              onDelete={deleteProduct}
              onMove={moveProduct}
            />
          )}
          {section === 'orders'   && <OrdersSection   orders={orders}   onUpdateTracking={updateTracking} />}
          {section === 'tracking'   && <TrackingSection />}
          {section === 'automation' && <AutomationSection />}
          {section === 'settings'   && <SettingsSection />}
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
  onToggleForm, onFormChange, onImageChange, onDescChange, onSubmit, onDelete, onMove,
  categories, newCategoryName, onNewCategoryNameChange, onCreateCategory,
  onMoveCategory, onSaveCategoryMedia }: {
  products: Product[];
  categories: Category[];
  showForm: boolean;
  saving: boolean;
  form: { name: string; price: string; category: string; stock: string; video: string };
  image: string | null;
  desc: string;
  newCategoryName: string;
  onToggleForm: () => void;
  onFormChange: (k: string, v: string) => void;
  onImageChange: (v: string | null) => void;
  onDescChange: (v: string) => void;
  onNewCategoryNameChange: (v: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: number, direction: 'up' | 'down') => void;
  onSaveCategoryMedia: (id: number, bannerType: 'image' | 'video', bannerUrl: string, logoUrl: string) => void;
  onSubmit: () => void;
  onDelete: (id: number, name: string) => void;
  onMove: (id: number, direction: 'up' | 'down') => void;
}) {
  const dropRef    = useRef<HTMLDivElement>(null);
  const descRef    = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
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

            {/* Categories: create + select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nova categoria</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => onNewCategoryNameChange(e.target.value)}
                    placeholder="Ex: Suplementos"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={onCreateCategory}
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Criar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Categoria do produto</label>
                <select
                  value={form.category}
                  onChange={e => onFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.filter(c => c.enabled).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cards das Categorias (loja)</p>
              {categories.length === 0 && (
                <div className="text-xs text-slate-400">Crie uma categoria para configurar banner/logo.</div>
              )}
              {categories.map((c, idx) => {
                const draft = categoryDrafts[c.id] ?? { bannerType: 'image' as const, bannerUrl: '', logoUrl: '' };
                return (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 w-5">{idx + 1}</span>
                      <span className="text-sm font-medium text-slate-800 flex-1">{c.name}</span>
                      <button type="button" onClick={() => onMoveCategory(c.id, 'up')} className="p-1.5 rounded border border-slate-200 hover:bg-white" title="Subir categoria">
                        <ArrowUp size={12} />
                      </button>
                      <button type="button" onClick={() => onMoveCategory(c.id, 'down')} className="p-1.5 rounded border border-slate-200 hover:bg-white" title="Descer categoria">
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={draft.bannerType}
                        onChange={e => setCategoryDrafts(prev => ({
                          ...prev,
                          [c.id]: { ...draft, bannerType: e.target.value === 'video' ? 'video' : 'image' },
                        }))}
                        className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="image">Banner imagem</option>
                        <option value="video">Banner vídeo</option>
                      </select>

                      <input
                        type="text"
                        value={draft.bannerUrl}
                        onChange={e => setCategoryDrafts(prev => ({
                          ...prev,
                          [c.id]: { ...draft, bannerUrl: e.target.value },
                        }))}
                        placeholder="URL do banner (img/video)"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs sm:col-span-2"
                      />

                      <input
                        type="text"
                        value={draft.logoUrl}
                        onChange={e => setCategoryDrafts(prev => ({
                          ...prev,
                          [c.id]: { ...draft, logoUrl: e.target.value },
                        }))}
                        placeholder="URL da logo da categoria (opcional)"
                        className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs sm:col-span-2"
                      />

                      <button
                        type="button"
                        onClick={() => onSaveCategoryMedia(c.id, draft.bannerType, draft.bannerUrl, draft.logoUrl)}
                        className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                      >
                        Salvar mídia
                      </button>
                    </div>
                  </div>
                );
              })}
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" /> Automação Dropshipping
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Verificação de estoque, pedidos automáticos e notificações ao cliente
            </p>
          </div>
          {/* Master toggle */}
          <button
            onClick={() => setSettings(p => ({ ...p, automation_enabled: !p.automation_enabled }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${settings.automation_enabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {settings.automation_enabled
              ? <><ToggleRight size={18} /> Automação ON</>
              : <><ToggleLeft  size={18} /> Automação OFF</>}
          </button>
        </div>

        {/* Pipeline visual */}
        <div className="mt-5 flex items-center gap-1 flex-wrap text-xs text-slate-500 overflow-x-auto">
          {[
            { icon: <ShoppingCart size={13} />, label: 'Compra' },
            { icon: <Globe size={13} />,        label: 'Estoque' },
            { icon: <Package size={13} />,      label: 'Pedido' },
            { icon: <Truck size={13} />,        label: 'Envio' },
            { icon: <MessageCircle size={13} />,label: 'WhatsApp' },
            { icon: <Mail size={13} />,         label: 'E-mail' },
          ].map((step, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full
                ${settings.automation_enabled ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                {step.icon}{step.label}
              </span>
              {i < arr.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
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
              ${tab === t.key ? 'bg-green-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="space-y-4">
          {/* Add supplier form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
              <Plus size={15} /> Adicionar Fornecedor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                placeholder="Nome do fornecedor"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <input
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                placeholder="Base URL da API"
                value={newUrl} onChange={e => setNewUrl(e.target.value)}
              />
              <input
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                placeholder="API Key (opcional)"
                value={newKey} onChange={e => setNewKey(e.target.value)}
              />
            </div>
            <button
              onClick={addSupplier}
              disabled={addingSupplier || !newName || !newUrl}
              className="mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {addingSupplier ? 'Adicionando…' : 'Adicionar Fornecedor'}
            </button>
          </div>

          {/* Supplier list */}
          {suppliers.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
              Nenhum fornecedor cadastrado. Adicione um acima.
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 flex-wrap">
                  <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.base_url}</p>
                    {s.api_key && (
                      <p className="text-xs text-slate-400 font-mono">
                        key: {s.api_key.slice(0, 8)}•••
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSupplier(s.id, s.active)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                        ${s.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {s.active ? 'Ativo' : 'Inativo'}
                    </button>
                    <button
                      onClick={() => deleteSupplier(s.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Webhook info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1 flex items-center gap-1.5">
              <Globe size={14} /> Webhook de rastreio do fornecedor
            </p>
            <p className="font-mono text-xs bg-white/60 border border-amber-200 rounded px-3 py-2 mt-2 break-all">
              POST https://vitafitstore.vercel.app/api/webhook/tracking
            </p>
            <p className="text-xs mt-2 text-amber-700">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-5">
          {/* WhatsApp */}
          <div>
            <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <MessageCircle size={15} className="text-green-600" /> WhatsApp
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-32">Provider</span>
                <select
                  value={settings.whatsapp_provider ?? 'zapi'}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_provider: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                >
                  <option value="zapi">Z-API (pago)</option>
                  <option value="evolution">Evolution API (open-source)</option>
                </select>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">
                  {settings.whatsapp_provider === 'evolution'
                    ? 'Evolution API URL (ex: http://localhost:8080)'
                    : 'Z-API URL (ex: https://api.z-api.io/instances/ID/token/TOKEN)'}
                </span>
                <input
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  placeholder="https://..."
                  value={settings.whatsapp_url ?? ''}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_url: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">
                  {settings.whatsapp_provider === 'evolution' ? 'API Key' : 'Client-Token'}
                </span>
                <input
                  type="password"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  placeholder="Token secreto"
                  value={settings.whatsapp_token ?? ''}
                  onChange={e => setSettings(p => ({ ...p, whatsapp_token: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
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

          <hr className="border-slate-100" />

          {/* Email */}
          <div>
            <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Mail size={15} className="text-blue-600" /> E-mail (SendGrid)
            </h3>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">SendGrid API Key</span>
                <input
                  type="password"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  placeholder="SG.xxxxxxxxxxxx"
                  value={settings.sendgrid_key ?? ''}
                  onChange={e => setSettings(p => ({ ...p, sendgrid_key: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
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
            className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">🤖 Scraper — fornecedores sem API</p>
        <p>Configure a URL do produto (use <code className="font-mono bg-white/60 px-1 rounded">{'{sku}'}</code> como placeholder) e o seletor CSS do elemento que mostra o estoque. O robô vai buscar o HTML e extrair o número automaticamente.</p>
        <p className="mt-1 text-xs text-blue-600">Suporte: <code className="font-mono">#id</code>, <code className="font-mono">.classe</code>, <code className="font-mono">tag.classe</code>, <code className="font-mono">[data-attr]</code></p>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          Cadastre fornecedores na aba "Fornecedores (API)" primeiro.
        </div>
      ) : (
        suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <button
              onClick={() => { setExpanded(expanded === s.id ? null : s.id); openSupplier(s); }}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.scraper_url_template ? 'bg-blue-500' : 'bg-slate-200'}`} />
                <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                {s.scraper_url_template && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">scraper ativo</span>
                )}
              </div>
              <ChevronRight size={16} className={`text-slate-400 transition-transform ${expanded === s.id ? 'rotate-90' : ''}`} />
            </button>

            {expanded === s.id && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">URL do Produto (com {'{sku}'})</span>
                  <input
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    placeholder="https://fornecedor.com/produto/{sku}"
                    value={urlTpl}
                    onChange={e => setUrlTpl(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Seletor CSS do Estoque</span>
                  <input
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    placeholder=".quantidade-estoque ou #stock ou [data-stock]"
                    value={selector}
                    onChange={e => setSelector(e.target.value)}
                  />
                </label>

                {/* Test area */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">Testar com URL real</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
                    <div className={`text-sm rounded-lg px-3 py-2 ${testResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
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
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Salvando…' : 'Salvar Scraper'}
                  </button>
                  <button
                    onClick={() => setExpanded(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-lg">
          <h3 className="font-medium text-slate-800 mb-1 flex items-center gap-2">
            <Upload size={16} className="text-green-600" /> Importar Catálogo do Fornecedor
          </h3>
          <p className="text-sm text-slate-500 mb-4">Carregue um arquivo CSV com os produtos. Colunas reconhecidas: <span className="font-mono text-xs">nome, preco_custo, estoque, categoria, imagem, sku</span></p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
            <Upload size={28} className="text-slate-300 mb-2" />
            <span className="text-sm text-slate-500">Clique para selecionar o CSV</span>
            <span className="text-xs text-slate-400 mt-1">Formato: .csv (UTF-8)</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
            />
          </label>

          <div className="mt-4">
            <label className="flex items-center justify-between text-sm text-slate-600 mb-1">
              <span>Margem de lucro padrão</span>
              <strong className="text-green-700">{margin}%</strong>
            </label>
            <input
              type="range" min={5} max={200} value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="w-full accent-green-600"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 max-w-lg">
          <p className="font-medium text-slate-700 mb-1">Exemplo de CSV aceito:</p>
          <pre className="font-mono bg-white rounded p-2 border border-slate-200 overflow-x-auto">{`sku,nome,preco_custo,estoque,categoria,imagem\nWHEY001,Whey Protein 1kg,89.90,42,Proteínas,https://...\nCREA001,Creatina 300g,45.00,18,Performance,https://...`}</pre>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center max-w-md">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-800 text-lg mb-1">Importação concluída!</h3>
        <p className="text-slate-500 text-sm">{importedCount} produtos adicionados à sua loja.</p>
        <button
          onClick={() => { setStep('upload'); setAllProducts([]); setSelected({}); }}
          className="mt-5 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[160px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="todas">Todas categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Margem:</span>
          <input
            type="number" min={0} max={500} value={margin}
            onChange={e => recalcMargin(Number(e.target.value))}
            className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
          />
          <span>%</span>
        </div>
        <button onClick={selectAll}   className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Todos</button>
        <button onClick={deselectAll} className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Nenhum</button>
        <span className="text-xs text-slate-400">{filtered.length} produtos</span>
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
              className={`relative bg-white rounded-xl border-2 cursor-pointer transition-all overflow-hidden
                ${isSel ? 'border-green-500 shadow-md shadow-green-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              {/* Checkbox badge */}
              <div className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold z-10
                ${isSel ? 'bg-green-500' : 'bg-white/80 border border-slate-300 text-slate-400'}`}>
                {isSel ? '✓' : ''}
              </div>

              {/* Image */}
              <div className="aspect-square bg-slate-50">
                {p.image
                  ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23f1f5f9"/><text x="40" y="44" text-anchor="middle" fill="%2394a3b8" font-size="24">📦</text></svg>')} />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                }
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium text-slate-800 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>

                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs text-slate-500">Custo: <span className="font-mono">R${p.cost.toFixed(2)}</span></p>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <span className="text-xs text-slate-600">Venda:</span>
                    <input
                      type="number"
                      value={isSel ? selP.salePrice : p.salePrice}
                      onChange={e => { if (!isSel) toggleProduct(p); editPrice(key, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="w-full border border-slate-200 rounded px-1 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                  <p className={`text-xs font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    Lucro: R${profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">📦 {p.stock} un.</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
        <span className="text-sm text-slate-600">
          {selCount > 0
            ? <span className="text-green-700 font-medium">✅ {selCount} produto(s) selecionado(s)</span>
            : 'Clique nos cards para selecionar'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={confirmImport}
            disabled={selCount === 0 || importing}
            className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
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


function SettingsSection() {
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Blocos da Home (Fase 2)</h2>
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
