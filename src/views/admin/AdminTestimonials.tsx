import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Edit, Trash2, X, Star, MessageSquare } from 'lucide-react';
import { Testimonial } from '../../types';

export default function AdminTestimonials() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ clientName: '', text: '', rating: 5, photo: '', active: true });

  const openNew = () => { setEditing(null); setForm({ clientName: '', text: '', rating: 5, photo: '', active: true }); setShowModal(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ clientName: t.clientName, text: t.text, rating: t.rating, photo: t.photo, active: t.active }); setShowModal(true); };

  const handleSave = () => {
    if (!form.clientName || !form.text) return;
    if (editing) { updateTestimonial(editing.id, form); } else { addTestimonial(form); }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Depoimentos</h1>
          <p className="text-white/50 text-sm">Gerencie os depoimentos exibidos na home</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Novo Depoimento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map(t => (
          <div key={t.id} className={`rounded-xl border p-5 transition ${t.active ? 'border-white/10 bg-[#1f2937]' : 'border-white/5 bg-[#1f2937]/50 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4" fill={i < t.rating ? '#c9a96e' : 'transparent'} stroke={i < t.rating ? '#c9a96e' : 'currentColor'} />)}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Edit className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir?')) deleteTestimonial(t.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-3 italic">"{t.text}"</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{t.clientName}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${t.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {t.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum depoimento cadastrado</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar' : 'Novo'} Depoimento</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome do Cliente *</label>
                <input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Depoimento *</label>
                <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Avaliação</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                      <Star className="w-6 h-6" fill={n <= form.rating ? '#c9a96e' : 'transparent'} stroke={n <= form.rating ? '#c9a96e' : 'currentColor'} />
                    </button>
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
