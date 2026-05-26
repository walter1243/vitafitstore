'use client';
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Settings,
  Menu, X, Plus, Trash2, ExternalLink, Check, Euro,
  ChevronRight, Upload,
} from "lucide-react";

type Section = 'dashboard' | 'products' | 'orders' | 'tracking' | 'settings';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  description?: string;
};

type Order = {
  id: number;
  customer: string;
  product: string;
  status: 'pending' | 'shipped' | 'delivered';
  tracking: string;
  total: number;
  date: string;
};

const SECTION_LABELS: Record<Section, string> = {
  dashboard: 'Dashboard',
  products: 'Produtos',
  orders: 'Pedidos',
  tracking: 'Rastreio',
  settings: 'Configurações',
};

export default function AdminPage() {
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Product form
  const [showForm, setShowForm] = useState(false);
  const [prodForm, setProdForm] = useState({ name: '', price: '', category: '', stock: '', description: '' });
  const [prodImage, setProdImage] = useState<string | null>(null);
  const [prodAlert, setProdAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pr, or] = await Promise.all([fetch('/api/products'), fetch('/api/orders')]);
      if (pr.ok) setProducts(await pr.json());
      if (or.ok) setOrders(await or.json());
    } catch {
      // silently use empty state; API may not be set up yet
    }
  }

  async function addProduct() {
    if (!prodForm.name || !prodForm.price) {
      setProdAlert({ type: 'error', msg: 'Nome e preço são obrigatórios.' });
      setTimeout(() => setProdAlert(null), 3000);
      return;
    }
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodForm.name,
          price: parseFloat(prodForm.price),
          category: prodForm.category,
          stock: parseInt(prodForm.stock) || 0,
          description: prodForm.description,
          image: prodImage,
        }),
      });
      if (res.ok) {
        const newProd = await res.json();
        setProducts(p => [...p, newProd]);
        setProdForm({ name: '', price: '', category: '', stock: '', description: '' });
        setProdImage(null);
        setShowForm(false);
        setProdAlert({ type: 'success', msg: 'Produto cadastrado com sucesso!' });
      } else {
        setProdAlert({ type: 'error', msg: 'Erro ao cadastrar produto.' });
      }
    } catch {
      setProdAlert({ type: 'error', msg: 'Erro de conexão.' });
    }
    setTimeout(() => setProdAlert(null), 3000);
  }

  async function deleteProduct(id: number) {
    setProducts(p => p.filter(x => x.id !== id));
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    } catch { /* revert if needed */ }
  }

  async function updateTracking(id: number, tracking: string, status: Order['status']) {
    setOrders(o => o.map(x => x.id === id ? { ...x, tracking, status } : x));
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tracking, status }),
      });
    } catch { /* ignore */ }
  }

  const revenue = orders.reduce((s, o) => s + o.total, 0);
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
    { key: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0`}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center font-bold text-lg shrink-0">V</div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">VitaFit Admin</div>
            <div className="text-[11px] text-white/40">Painel de Controle</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded cursor-pointer text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-5 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Menu</div>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer transition-colors border-l-2
                ${section === item.key
                  ? 'bg-white/10 text-white border-green-500'
                  : 'text-white/60 border-transparent hover:bg-white/5 hover:text-white'}`}
            >
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 h-16 flex items-center gap-4 shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <h1 className="flex-1 font-semibold text-slate-800 text-base">{SECTION_LABELS[section]}</h1>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Ao vivo
            </span>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 lg:p-6">
          {section === 'dashboard' && (
            <DashboardSection products={products} orders={orders} revenue={revenue} onNavigate={navigate} />
          )}
          {section === 'products' && (
            <ProductsSection
              products={products}
              alert={prodAlert}
              showForm={showForm}
              form={prodForm}
              image={prodImage}
              onToggleForm={() => setShowForm(f => !f)}
              onFormChange={(k, v) => setProdForm(f => ({ ...f, [k]: v }))}
              onImageChange={setProdImage}
              onSubmit={addProduct}
              onDelete={deleteProduct}
            />
          )}
          {section === 'orders' && (
            <OrdersSection orders={orders} onUpdateTracking={updateTracking} />
          )}
          {section === 'tracking' && <TrackingSection />}
          {section === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({
  products, orders, revenue, onNavigate,
}: {
  products: Product[];
  orders: Order[];
  revenue: number;
  onNavigate: (s: Section) => void;
}) {
  const stats = [
    { label: 'Produtos', value: products.length, sub: 'cadastrados', icon: <Package size={20} className="text-green-600" />, bg: 'bg-green-50' },
    { label: 'Pedidos', value: orders.length, sub: `${orders.filter(o => o.status === 'pending').length} aguardando`, icon: <ShoppingCart size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Receita', value: `€${revenue.toFixed(2)}`, sub: 'total', icon: <Euro size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Em trânsito', value: orders.filter(o => o.status === 'shipped').length, sub: 'enviados', icon: <Truck size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-slate-800 truncate">{s.value}</div>
              <div className="text-sm text-slate-500 truncate">{s.label}</div>
              <div className="text-xs text-slate-400 truncate">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <TableCard
        title="Últimos Pedidos"
        icon={<ShoppingCart size={15} className="text-slate-400" />}
        action={{ label: 'Ver todos', onClick: () => onNavigate('orders') }}
      >
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['#', 'Cliente', 'Produto', 'Total', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.slice(0, 5).map(o => (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono font-semibold text-slate-500 text-xs">#{o.id}</td>
                <td className="px-5 py-3 text-slate-700 font-medium">{o.customer}</td>
                <td className="px-5 py-3 text-slate-600">{o.product}</td>
                <td className="px-5 py-3 font-semibold text-slate-800">€{o.total.toFixed(2)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum pedido</td></tr>
            )}
          </tbody>
        </table>
      </TableCard>

      <TableCard
        title="Produtos"
        icon={<Package size={15} className="text-slate-400" />}
        action={{ label: 'Gerenciar', onClick: () => onNavigate('products') }}
      >
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Produto', 'Categoria', 'Preço', 'Estoque'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-5 py-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.category}</span>
                </td>
                <td className="px-5 py-3 font-semibold text-green-700">€{p.price.toFixed(2)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold ${p.stock > 20 ? 'text-green-600' : p.stock > 5 ? 'text-amber-600' : 'text-red-600'}`}>
                    {p.stock} un.
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">Nenhum produto</td></tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────────────────────

function ProductsSection({
  products, alert, showForm, form, image,
  onToggleForm, onFormChange, onImageChange, onSubmit, onDelete,
}: {
  products: Product[];
  alert: { type: 'success' | 'error'; msg: string } | null;
  showForm: boolean;
  form: { name: string; price: string; category: string; stock: string; description: string };
  image: string | null;
  onToggleForm: () => void;
  onFormChange: (key: string, value: string) => void;
  onImageChange: (v: string | null) => void;
  onSubmit: () => void;
  onDelete: (id: number) => void;
}) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const fields = [
    { key: 'name', label: 'Nome *', placeholder: 'Ex: Whey Protein 1kg', type: 'text' },
    { key: 'price', label: 'Preço (€) *', placeholder: '29.99', type: 'number' },
    { key: 'category', label: 'Categoria', placeholder: 'Ex: Suplementos', type: 'text' },
    { key: 'stock', label: 'Estoque (un.)', placeholder: '100', type: 'number' },
  ];

  return (
    <div className="space-y-6">
      {alert && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border ${
          alert.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {alert.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {alert.msg}
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package size={16} className="text-slate-400" />
            {showForm ? 'Novo Produto' : 'Produtos'}
          </h2>
          <button
            onClick={onToggleForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            {showForm ? <><X size={13} /> Cancelar</> : <><Plus size={13} /> Novo produto</>}
          </button>
        </div>

        {showForm && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => onFormChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => onFormChange('description', e.target.value)}
                placeholder="Descrição completa do produto, ingredientes, modo de uso..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Imagem</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                <Upload size={22} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">Clique para selecionar imagem</span>
                <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {image && (
                <div className="mt-3 relative inline-block">
                  <img src={image} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                  <button
                    onClick={() => onImageChange(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={onSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Check size={15} />
                Cadastrar Produto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <TableCard title={`Todos os produtos (${products.length})`} icon={<Package size={15} className="text-slate-400" />}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Produto', 'Categoria', 'Preço', 'Estoque', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Package size={15} className="text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{p.name}</div>
                      {p.description && <div className="text-xs text-slate-400 truncate max-w-[180px]">{p.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.category || '—'}</span>
                </td>
                <td className="px-5 py-3 font-semibold text-green-700">€{p.price.toFixed(2)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold ${p.stock > 20 ? 'text-green-600' : p.stock > 5 ? 'text-amber-600' : 'text-red-600'}`}>
                    {p.stock} un.
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                    title="Remover produto"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">Nenhum produto cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function OrdersSection({
  orders,
  onUpdateTracking,
}: {
  orders: Order[];
  onUpdateTracking: (id: number, tracking: string, status: Order['status']) => void;
}) {
  const [inputs, setInputs] = useState<Record<number, string>>(
    Object.fromEntries(orders.map(o => [o.id, o.tracking]))
  );

  useEffect(() => {
    setInputs(Object.fromEntries(orders.map(o => [o.id, o.tracking])));
  }, [orders]);

  function save(id: number) {
    const tracking = inputs[id] ?? '';
    const status: Order['status'] = tracking ? 'shipped' : 'pending';
    onUpdateTracking(id, tracking, status);
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-bold text-slate-700 font-mono text-sm">#{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="text-xs text-slate-400">{order.date}</div>
            </div>
            <div className="font-bold text-lg text-slate-800">€{order.total.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Cliente</div>
              <div className="text-slate-700 font-medium">{order.customer}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Produto</div>
              <div className="text-slate-600">{order.product}</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={inputs[order.id] ?? ''}
              onChange={e => setInputs(t => ({ ...t, [order.id]: e.target.value }))}
              placeholder="Código de rastreio (ex: ES123456789ES)"
              className="flex-1 min-w-[180px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
            />
            <button
              onClick={() => save(order.id)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check size={14} />
              Salvar
            </button>
            {order.tracking && (
              <a
                href={`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${order.tracking}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <ExternalLink size={14} />
                Rastrear
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-lg">
      <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Truck size={16} className="text-slate-400" />
        Rastrear Envio
      </h2>
      <p className="text-sm text-slate-500 mb-4">Consulte o estado de qualquer envio pelo código de rastreio.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.trim())}
          placeholder="Ex: ES123456789ES"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter' && code) {
              window.open(`https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}`, '_blank');
            }
          }}
        />
        <a
          href={code ? `https://www.correos.es/es/es/herramientas/localizador/envios?numero=${code}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap
            ${code ? 'hover:bg-green-700 cursor-pointer' : 'opacity-40 pointer-events-none'}`}
        >
          <ExternalLink size={14} />
          Rastrear
        </a>
      </div>
      <p className="text-xs text-slate-400 mt-3">Rastreio via Correos de España</p>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsSection() {
  const [ig, setIg] = useState('');
  const [fb, setFb] = useState('');
  const [storeName, setStoreName] = useState('VitaFit');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Informações da Loja</h2>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome da loja</label>
          <input
            type="text"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Redes Sociais</h2>
        <div className="space-y-4">
          {[
            { label: 'Instagram', value: ig, setter: setIg, placeholder: '@vitafit' },
            { label: 'Facebook', value: fb, setter: setFb, placeholder: 'VitaFit' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={e => f.setter(e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          <Check size={15} />
          Salvar configurações
        </button>
        {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-1"><Check size={14} /> Salvo!</span>}
      </div>
    </form>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { label: string; className: string }> = {
    pending: { label: 'Aguardando', className: 'bg-amber-100 text-amber-700' },
    shipped: { label: 'Enviado', className: 'bg-blue-100 text-blue-700' },
    delivered: { label: 'Entregue', className: 'bg-green-100 text-green-700' },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function TableCard({
  title, icon, action, children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
          {icon}
          {title}
        </h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer font-medium transition-colors"
          >
            {action.label} <ChevronRight size={13} />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

