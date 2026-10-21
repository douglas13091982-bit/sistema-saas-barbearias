import { useData } from '../../contexts/DataContext';
import { Save } from 'lucide-react';
import { useState } from 'react';

export default function AdminHomeContent() {
  const { siteSettings, updateSiteSettings } = useData();
  const [form, setForm] = useState(siteSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSiteSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conteúdo da Home</h1>
          <p className="text-white/50 text-sm">Gerencie textos, seções e informações da página inicial</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Save className="w-4 h-4" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Informações Gerais</h3>
          <div>
            <label className="block text-sm text-white/70 mb-1">Nome da Barbearia</label>
            <input value={form.barbershopName} onChange={e => setForm({ ...form, barbershopName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Tagline</label>
            <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Título do Hero</label>
            <input value={form.heroTitle} onChange={e => setForm({ ...form, heroTitle: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Subtítulo do Hero</label>
            <textarea value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30 resize-none" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Texto do Botão</label>
            <input value={form.heroButtonText} onChange={e => setForm({ ...form, heroButtonText: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">URL do Banner</label>
            <input value={form.heroImage} onChange={e => setForm({ ...form, heroImage: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Contato & Localização</h3>
          <div>
            <label className="block text-sm text-white/70 mb-1">Telefone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">WhatsApp (com código do país)</label>
            <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">E-mail</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Endereço</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Cidade</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Estado</label>
              <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Redes Sociais</h3>
          <div>
            <label className="block text-sm text-white/70 mb-1">Instagram</label>
            <input value={form.socialMedia.instagram} onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, instagram: e.target.value } })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Facebook</label>
            <input value={form.socialMedia.facebook} onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, facebook: e.target.value } })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">TikTok</label>
            <input value={form.socialMedia.tiktok} onChange={e => setForm({ ...form, socialMedia: { ...form.socialMedia, tiktok: e.target.value } })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
        </div>

        {/* Business Hours */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Horário de Funcionamento</h3>
          <div className="space-y-2">
            {form.businessHours.map((bh, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-white/70">{dayNames[bh.dayOfWeek]}</span>
                <label className="flex items-center gap-1 text-xs text-white/50">
                  <input type="checkbox" checked={bh.active} onChange={e => { const bhs = [...form.businessHours]; bhs[idx] = { ...bhs[idx], active: e.target.checked }; setForm({ ...form, businessHours: bhs }); }} />
                  Aberto
                </label>
                {bh.active && (
                  <>
                    <input type="time" value={bh.start} onChange={e => { const bhs = [...form.businessHours]; bhs[idx] = { ...bhs[idx], start: e.target.value }; setForm({ ...form, businessHours: bhs }); }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs" />
                    <span className="text-white/30">-</span>
                    <input type="time" value={bh.end} onChange={e => { const bhs = [...form.businessHours]; bhs[idx] = { ...bhs[idx], end: e.target.value }; setForm({ ...form, businessHours: bhs }); }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-xs" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-white">Seções da Home</h3>
          <p className="text-xs text-white/50">Ative ou desative seções da página inicial</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {form.sections.map((section, idx) => (
              <div key={section.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <input type="checkbox" checked={section.active} onChange={e => { const secs = [...form.sections]; secs[idx] = { ...secs[idx], active: e.target.checked }; setForm({ ...form, sections: secs }); }} className="rounded" />
                <span className="text-sm text-white">{section.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
