import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Edit, Trash2, X, Shield } from 'lucide-react';
import { User } from '../../types';

export default function AdminUsers() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendant' as 'admin' | 'attendant' | 'barber', active: true, barberId: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'attendant', active: true, barberId: '' }); setShowModal(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active, barberId: u.barberId || '' }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editing) {
      const data: Partial<User> = { name: form.name, email: form.email, role: form.role, active: form.active };
      if (form.password) data.password = form.password;
      updateUser(editing.id, data);
    } else {
      if (!form.password) return;
      addUser({ ...form });
    }
    setShowModal(false);
  };

  const roleLabels = { admin: 'Administrador', attendant: 'Atendente', barber: 'Barbeiro' };
  const roleColors = { admin: 'bg-purple-500/20 text-purple-400', attendant: 'bg-blue-500/20 text-blue-400', barber: 'bg-green-500/20 text-green-400' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-white/50 text-sm">Gerencie os usuários do sistema</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1f2937] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-white/50 font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">E-mail</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Perfil</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="py-3 px-4 text-white font-medium">{user.name} {user.id === currentUser?.id && <span className="text-xs text-white/40">(você)</span>}</td>
                <td className="py-3 px-4 text-white/70">{user.email}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${roleColors[user.role]}`}>{roleLabels[user.role]}</span></td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${user.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{user.active ? 'Ativo' : 'Inativo'}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Edit className="w-4 h-4" /></button>
                    {user.id !== currentUser?.id && (
                      <button onClick={() => { if (confirm('Excluir usuário?')) deleteUser(user.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">E-mail *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Senha {editing ? '(deixe vazio para manter)' : '*'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Perfil</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
                  <option value="admin">Administrador</option>
                  <option value="attendant">Atendente</option>
                  <option value="barber">Barbeiro</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" /> Ativo
              </label>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5 transition">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
