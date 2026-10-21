import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Eye } from 'lucide-react';

export default function AdminTheme() {
  const { themeSettings, updateThemeSettings } = useData();
  const [form, setForm] = useState(themeSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateThemeSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const presets = [
    { name: 'Dark Gold', primary: '#1a1a2e', secondary: '#16213e', accent: '#c9a96e', bg: '#0f0f0f', button: '#c9a96e', text: '#ffffff' },
    { name: 'Classic Blue', primary: '#1e3a5f', secondary: '#0d1b2a', accent: '#4fc3f7', bg: '#0a1628', button: '#4fc3f7', text: '#ffffff' },
    { name: 'Modern Red', primary: '#2d1b1b', secondary: '#1a0f0f', accent: '#e74c3c', bg: '#121212', button: '#e74c3c', text: '#ffffff' },
    { name: 'Green Nature', primary: '#1b2d1b', secondary: '#0f1a0f', accent: '#27ae60', bg: '#0f120f', button: '#27ae60', text: '#ffffff' },
    { name: 'Purple Royal', primary: '#2d1b3d', secondary: '#1a0f2a', accent: '#9b59b6', bg: '#120f18', button: '#9b59b6', text: '#ffffff' },
    { name: 'Light Clean', primary: '#f8f9fa', secondary: '#e9ecef', accent: '#2c3e50', bg: '#ffffff', button: '#2c3e50', text: '#212529' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Personalização Visual</h1>
          <p className="text-white/50 text-sm">Personalize cores, fontes e aparência do sistema</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Save className="w-4 h-4" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Cores</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor Primária</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor Secundária</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor de Destaque</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.accentColor} onChange={e => setForm({ ...form, accentColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor de Fundo</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.backgroundColor} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.backgroundColor} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor dos Botões</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.buttonColor} onChange={e => setForm({ ...form, buttonColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.buttonColor} onChange={e => setForm({ ...form, buttonColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Cor dos Textos</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <input value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Style Settings */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Estilo</h3>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fonte</label>
            <select value={form.fontFamily} onChange={e => setForm({ ...form, fontFamily: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
              <option value="Inter">Inter</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="system-ui">System UI</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Estilo dos Botões</label>
            <div className="flex gap-3">
              {(['rounded', 'sharp', 'pill'] as const).map(style => (
                <button key={style} onClick={() => setForm({ ...form, buttonStyle: style })} className={`flex-1 py-2.5 text-sm font-medium border transition ${form.buttonStyle === style ? 'border-[#c9a96e] bg-[#c9a96e]/20 text-[#c9a96e]' : 'border-white/10 text-white/50 hover:border-white/30'} ${style === 'rounded' ? 'rounded-lg' : style === 'pill' ? 'rounded-full' : 'rounded-none'}`}>
                  {style === 'rounded' ? 'Arredondado' : style === 'sharp' ? 'Reto' : 'Pílula'}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={form.darkMode} onChange={e => setForm({ ...form, darkMode: e.target.checked })} className="rounded" /> Modo Escuro
          </label>
        </div>

        {/* Presets */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-white">Temas Pré-definidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => setForm({ ...form, primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent, backgroundColor: preset.bg, buttonColor: preset.button, textColor: preset.text })}
                className="p-3 rounded-xl border border-white/10 hover:border-white/30 transition text-center"
              >
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bg }} />
                </div>
                <p className="text-xs text-white/70">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Eye className="w-4 h-4" /> Pré-visualização</h3>
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: form.backgroundColor, color: form.textColor, fontFamily: form.fontFamily }}>
            <div className="p-8 text-center" style={{ backgroundColor: form.primaryColor }}>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>Preview do Hero</h2>
              <p className="text-sm opacity-70 mb-4">Este é um exemplo de como ficará sua página</p>
              <button className={`px-6 py-2.5 font-semibold text-sm ${form.buttonStyle === 'rounded' ? 'rounded-lg' : form.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-none'}`} style={{ backgroundColor: form.buttonColor, color: form.darkMode ? '#000' : '#fff' }}>
                Agendar Agora
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-lg border" style={{ borderColor: `${form.textColor}20`, backgroundColor: `${form.textColor}08` }}>
                    <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: form.accentColor }} />
                    <div className="h-3 rounded mb-2 w-3/4" style={{ backgroundColor: `${form.textColor}30` }} />
                    <div className="h-2 rounded w-full" style={{ backgroundColor: `${form.textColor}15` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
