import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { GalleryImage } from '../../types';

export default function AdminGallery() {
  const { gallery, addGalleryImage, updateGalleryImage, deleteGalleryImage } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ url: '', caption: '', order: gallery.length + 1 });

  const handleSave = () => {
    if (!form.url) return;
    addGalleryImage(form);
    setForm({ url: '', caption: '', order: gallery.length + 2 });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Galeria</h1>
          <p className="text-white/50 text-sm">Gerencie as imagens da galeria</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Adicionar Imagem
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map(img => (
          <div key={img.id} className="group relative rounded-xl overflow-hidden border border-white/10 bg-[#1f2937]">
            <img src={img.url} alt={img.caption} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
              <button onClick={() => { if (confirm('Excluir imagem?')) deleteGalleryImage(img.id); }} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/80 text-white transition">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <p className="text-xs text-white/70 truncate">{img.caption}</p>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <div className="text-center py-12 text-white/40">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma imagem na galeria</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Adicionar Imagem</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">URL da Imagem *</label>
                <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Legenda</label>
                <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              {form.url && (
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <img src={form.url} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5 transition">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
