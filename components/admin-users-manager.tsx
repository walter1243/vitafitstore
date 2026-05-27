'use client';

import { useEffect, useState } from 'react';
import { Check, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';

type AdminUser = {
  id: number;
  username: string;
  displayName: string;
  photoUrl: string;
  role: string;
  active: boolean;
  createdAt?: string;
};

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', photoUrl: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPassword, setEditingPassword] = useState('');

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar usuários.');
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao carregar usuários.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser() {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      setMessage({ type: 'error', text: 'Preencha usuário e senha.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar usuário.');
      setMessage({ type: 'success', text: 'Usuário criado com sucesso.' });
      setNewUser({ username: '', displayName: '', password: '', photoUrl: '' });
      await loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao criar usuário.' });
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(user: AdminUser) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          role: user.role,
          active: user.active,
          password: editingId === user.id && editingPassword ? editingPassword : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar usuário.');
      setMessage({ type: 'success', text: 'Usuário atualizado com sucesso.' });
      setEditingId(null);
      setEditingPassword('');
      await loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao atualizar usuário.' });
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id: number) {
    if (!window.confirm('Deseja excluir este usuário?')) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Erro ao excluir usuário.');
      setMessage({ type: 'success', text: 'Usuário removido.' });
      await loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao excluir usuário.' });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h2 className="mb-3 font-semibold text-white">Segurança e usuários do painel</h2>
        <p className="mb-4 text-xs text-white/50">Crie novos acessos com foto, atualize senha e encerre sessão quando necessário.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={newUser.username}
            onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
            placeholder="Usuário"
            className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={newUser.displayName}
            onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Nome de exibição"
            className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={newUser.password}
            onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
            type="password"
            placeholder="Senha"
            className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={newUser.photoUrl}
            onChange={(e) => setNewUser((p) => ({ ...p, photoUrl: e.target.value }))}
            placeholder="URL da foto (opcional)"
            className="rounded-lg border border-white/10 bg-[#22263a] px-3 py-2 text-sm text-white outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createUser}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Plus size={13} /> Criar usuário
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={13} /> Sair da conta atual
          </button>
        </div>

        {message && (
          <div className={`mt-3 rounded-xl border px-3 py-2 text-sm ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1a1d27] p-5 shadow-none">
        <h3 className="mb-3 text-sm font-semibold text-white">Usuários cadastrados</h3>
        {loading ? (
          <div className="text-xs text-white/50">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="text-xs text-white/50">Sem usuários cadastrados.</div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-green-600/20">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.displayName || user.username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-green-200">{(user.displayName || user.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <input
                    value={user.displayName}
                    onChange={(e) => setUsers((prev) => prev.map((it) => it.id === user.id ? { ...it, displayName: e.target.value } : it))}
                    className="min-w-[150px] flex-1 rounded-lg border border-white/10 bg-[#22263a] px-2 py-1.5 text-xs text-white outline-none"
                  />

                  <input
                    value={user.username}
                    onChange={(e) => setUsers((prev) => prev.map((it) => it.id === user.id ? { ...it, username: e.target.value } : it))}
                    className="min-w-[130px] rounded-lg border border-white/10 bg-[#22263a] px-2 py-1.5 text-xs text-white outline-none"
                  />

                  <input
                    value={user.photoUrl || ''}
                    onChange={(e) => setUsers((prev) => prev.map((it) => it.id === user.id ? { ...it, photoUrl: e.target.value } : it))}
                    placeholder="URL da foto"
                    className="min-w-[170px] flex-1 rounded-lg border border-white/10 bg-[#22263a] px-2 py-1.5 text-xs text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(user.id);
                      const value = window.prompt('Nova senha para este usuário:') || '';
                      setEditingPassword(value.trim());
                    }}
                    className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5"
                    title="Alterar senha"
                  >
                    <Pencil size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateUser(user)}
                    className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                    title="Salvar usuário"
                  >
                    <Check size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeUser(user.id)}
                    className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10"
                    title="Excluir usuário"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
