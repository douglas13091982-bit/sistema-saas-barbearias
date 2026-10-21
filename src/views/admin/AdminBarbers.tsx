import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { Barber } from '../../types';

export default function AdminBarbers() {
  const { barbers, services, addBarber, updateBarber, deleteBarber } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState({ name: '', photo: '', specialty: '', bio: '', active: true, order: 1, serviceIds: [] as string[], workingHours: [] as any[], daysOff: [] as string[] });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face', specialty: '', bio: '', active: true, order: barbers.length + 1, serviceIds: [], workingHours: [
      { dayOfWeek: 1, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 2, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 3, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 4, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 5, start: '09:00', end: '18:00', active: true },
      { dayOfWeek: 6, start: '09:00', end: '15:00', active: true },
    ], daysOff: [] });
    setShowModal(true);
  };

  const openEdit = (b: Barber) => {
    setEditing(b);
    setForm({ name: b.name, photo: b.photo, specialty: b.specialty, bio: b.bio, active: b.active, order: b.order, serviceIds: b.serviceIds, workingHours: b.workingHours, daysOff: b.daysOff });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) { updateBarber(editing.id, form); } else { addBarber(form); }
    setShowModal(false);
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const toggleService = (serviceId: string) => {
    setForm(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId) ? prev.serviceIds.filter(id => id !== serviceId) : [...prev.serviceIds, serviceId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Barbeiros</h1>
          <p className="text-white/50 text-sm">Gerencie a equipe de barbeiros</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Novo Barbeiro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(barber => (
          <div key={barber.id} className={`rounded-xl border p-5 transition ${barber.active ? 'border-white/10 bg-[#1f2937]' : 'border-white/5 bg-[#1f2937]/50 opacity-60'}`}>
            <div className="flex items-center gap-4 mb-4">
              <img src={barber.photo} alt={barber.name} className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: '#c9a96e' }} />
              <div>
                <h3 className="font-semibold text-white">{barber.name}</h3>
                <p className="text-xs" style={{ color: '#c9a96e' }}>{barber.specialty}</p>
              </div>
            </div>
            <p className="text-white/50 text-sm mb-3 line-clamp-2">{barber.bio}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${barber.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {barber.active ? 'Ativo' : 'Inativo'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(barber)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir barbeiro?')) deleteBarber(barber.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {barbers.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum barbeiro cadastrado</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">URL da Foto</label>
                <input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Especialidade</label>
                <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Serviços que atende</label>
                <div className="flex flex-wrap gap-2">
                  {services.map(s => (
                    <button key={s.id} onClick={() => toggleService(s.id)} className={`text-xs px-3 py-1.5 rounded-full border transition ${form.serviceIds.includes(s.id) ? 'border-[#c9a96e] bg-[#c9a96e]/20 text-[#c9a96e]' : 'border-white/10 text-white/50 hover:border-white/30'}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Horário de Trabalho</label>
                <div className="space-y-2">
                  {form.workingHours.map((wh, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-8 text-white/50">{dayNames[wh.dayOfWeek]}</span>
                      <input type="time" value={wh.start} onChange={e => { const whs = [...form.workingHours]; whs[idx] = { ...whs[idx], start: e.target.value }; setForm({ ...form, workingHours: whs }); }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs" />
                      <span className="text-white/30">-</span>
                      <input type="time" value={wh.end} onChange={e => { const whs = [...form.workingHours]; whs[idx] = { ...whs[idx], end: e.target.value }; setForm({ ...form, workingHours: whs }); }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs" />
                      <label className="flex items-center gap-1 text-xs text-white/50">
                        <input type="checkbox" checked={wh.active} onChange={e => { const whs = [...form.workingHours]; whs[idx] = { ...whs[idx], active: e.target.checked }; setForm({ ...form, workingHours: whs }); }} />
                        Ativo
                      </label>
                    </div>
                  ))}
                </div>
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
