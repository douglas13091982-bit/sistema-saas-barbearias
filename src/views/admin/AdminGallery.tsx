// @ts-nocheck -- imported code, kept as written
import { PhotoUpload } from '@/components/PhotoUpload';
import { useState } from 'react';
import { SiteImage } from '@/components/SiteImage';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { GalleryImage } from '../../types';

export default function AdminGallery() {
  const { gallery, addGalleryImage, updateGalleryImage, deleteGalleryImage } = useData();
  const [showModal, setShowModal] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ url: '', caption: '', order: gallery.length + 1 });

  const handleSave = async () => {
    if (photoBusy || saving) return;
    if (!form.url) { setSaveError('Escolha uma foto para a galeria.'); return; }
    setSaving(true); setSaveError('');
    try {
      await addGalleryImage(form);
      setForm({ url: '', caption: '', order: gallery.length + 2 });
      setShowModal(false);
    } catch { setSaveError('Não foi possível salvar a foto. Tente novamente.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Galeria</h1>
          <p className="text-white/50 text-sm">Gerencie as imagens da galeria</p>
        </div>
        <button onClick={() => { setForm({ url: '', caption: '', order: gallery.length + 1 }); setSaveError(''); setPhotoBusy(false); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Plus className="w-4 h-4" /> Adicionar Imagem
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery.map(img => (
          <div key={img.id} className="group relative rounded-xl overflow-hidden border border-white/10 bg-[#1f2937]">
            <SiteImage src={img.url} alt={img.caption} className="w-full h-40 object-cover" />
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
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Adicionar Imagem</h2>
              <button disabled={saving || photoBusy} onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <PhotoUpload id="gallery-photo" label="Foto da galeria *" value={form.url} onChange={url => setForm(prev => ({ ...prev, url }))} onBusyChange={setPhotoBusy} disabled={saving} />
              <div>
                <label className="block text-sm text-white/70 mb-1">Legenda</label>
                <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              {saveError && <p role="alert" className="text-sm text-red-300">{saveError}</p>}
              <div className="flex gap-3 pt-4">
                <button disabled={saving || photoBusy} onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5 transition">Cancelar</button>
                <button onClick={handleSave} disabled={!form.url || photoBusy || saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>{saving ? 'Salvando...' : 'Salvar foto'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
