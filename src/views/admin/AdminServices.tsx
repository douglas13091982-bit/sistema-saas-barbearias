import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Edit, Trash2, X, Scissors, Clock, DollarSign } from 'lucide-react';
import { Service } from '../../types';

export default function AdminServices() {
  const { services, addService, updateService, deleteService, appointments } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 30, category: 'Cortes', active: true, featured: false, image: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', price: 0, duration: 30, category: 'Cortes', active: true, featured: false, image: '' }); setShowModal(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, category: s.category, active: s.active, featured: s.featured, image: s.image }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      updateService(editing.id, form);
    } else {
      addService(form);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Serviços com agendamentos serão apenas inativados.')) {
      deleteService(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Serviços</h1>
          <p className="text-white/50 text-sm">Gerencie os serviços oferecidos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition hover:scale-105" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => {
          const hasAppts = appointments.some(a => a.serviceId === service.id);
          return (
            <div key={service.id} className={`rounded-xl border p-5 transition ${service.active ? 'border-white/10 bg-[#1f2937]' : 'border-white/5 bg-[#1f2937]/50 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" style={{ color: '#c9a96e' }} />
                  <h3 className="font-semibold text-white">{service.name}</h3>
                </div>
                {service.featured && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Destaque</span>}
              </div>
              <p className="text-white/50 text-sm mb-3">{service.description}</p>
              <div className="flex items-center gap-4 text-sm mb-4">
                <span className="flex items-center gap-1 text-white/70"><DollarSign className="w-4 h-4" /> R$ {service.price.toFixed(2)}</span>
                <span className="flex items-center gap-1 text-white/70"><Clock className="w-4 h-4" /> {service.duration}min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${service.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-xs text-white/40">{service.category}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => openEdit(service)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(service.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Preço (R$)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Duração (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
                  <option value="Cortes">Cortes</option>
                  <option value="Barba">Barba</option>
                  <option value="Combos">Combos</option>
                  <option value="Tratamentos">Tratamentos</option>
                  <option value="Acabamento">Acabamento</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" /> Ativo
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="rounded" /> Destaque
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5 transition">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-medium transition hover:scale-[1.02]" style={{ backgroundColor: '#c9a96e', color: '#000' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
