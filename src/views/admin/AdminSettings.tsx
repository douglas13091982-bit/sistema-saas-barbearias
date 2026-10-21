// @ts-nocheck -- imported code, kept as written
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, X, Settings as SettingsIcon } from 'lucide-react';
import { Holiday } from '../../types';

export default function AdminSettings() {
  const { siteSettings, updateSiteSettings, holidays, addHoliday, deleteHoliday } = useData();
  const [form, setForm] = useState(siteSettings);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [readingLogo, setReadingLogo] = useState(false);

  const handleLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLogoError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setLogoError('Escolha uma imagem PNG, JPG ou WebP.'); return;
    }
    if (file.size > 1024 * 1024) {
      setLogoError('A imagem deve ter até 1 MB.'); return;
    }
    setReadingLogo(true);
    try {
      const logo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Imagem inválida.'));
        image.src = logo;
      });
      setForm(prev => ({ ...prev, logo }));
      setSaved(false);
    } catch {
      setLogoError('Não foi possível abrir a imagem. Escolha outro arquivo.');
    } finally { setReadingLogo(false); }
  };
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', active: true });

  const handleSave = async () => {
    try {
      await updateSiteSettings(form);
      setLogoError('');
    } catch {
      setLogoError('Não foi possível salvar. Verifique sua conexão e tente novamente.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddHoliday = () => {
    if (!holidayForm.name || !holidayForm.date) return;
    addHoliday(holidayForm);
    setHolidayForm({ name: '', date: '', active: true });
    setShowHolidayModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-white/50 text-sm">Configurações gerais do sistema</p>
        </div>
        <button onClick={handleSave} disabled={readingLogo} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>
          <Save className="w-4 h-4" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-white">Logo da Barbearia</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-32 h-24 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center p-2">
              {form.logo ? <img src={form.logo} alt="Prévia da logo" className="max-w-full max-h-full object-contain" /> : <span className="text-sm text-white/50">Sem logo</span>}
            </div>
            <div className="space-y-2 min-w-0">
              <label htmlFor="barbershop-logo" className="block text-sm text-white/70">Enviar logo</label>
              <input id="barbershop-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={readingLogo} onChange={handleLogo} className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white" />
              <p className="text-xs text-white/50">{readingLogo ? 'Lendo imagem...' : 'PNG, JPG ou WebP, até 1 MB. Clique em Salvar para aplicar.'}</p>
              {form.logo && <button type="button" disabled={readingLogo} onClick={() => { setForm(prev => ({ ...prev, logo: '' })); setSaved(false); }} className="text-sm text-red-400 hover:underline">Remover logo</button>}
            </div>
          </div>
          {logoError && <p role="alert" className="text-sm text-red-400">{logoError}</p>}
        </div>
        {/* Business Info */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Informações do Negócio</h3>
          <div>
            <label className="block text-sm text-white/70 mb-1">CNPJ</label>
            <input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Moeda</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
              <option value="R$">R$ (Real)</option>
              <option value="$">$ (Dólar)</option>
              <option value="€">€ (Euro)</option>
            </select>
          </div>
        </div>

        {/* Scheduling Rules */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4">
          <h3 className="font-semibold text-white">Regras de Agendamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Antecedência Mín. (horas)</label>
              <input type="number" value={form.minAdvanceHours} onChange={e => setForm({ ...form, minAdvanceHours: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Antecedência Máx. (dias)</label>
              <input type="number" value={form.maxAdvanceDays} onChange={e => setForm({ ...form, maxAdvanceDays: parseInt(e.target.value) || 30 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Intervalo entre Atend. (min)</label>
              <input type="number" value={form.intervalMinutes} onChange={e => setForm({ ...form, intervalMinutes: parseInt(e.target.value) || 15 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Tolerância de Atraso (min)</label>
              <input type="number" value={form.toleranceMinutes} onChange={e => setForm({ ...form, toleranceMinutes: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Política de Cancelamento</label>
            <textarea value={form.cancelPolicy} onChange={e => setForm({ ...form, cancelPolicy: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30 resize-none" />
          </div>
        </div>

        {/* Holidays */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Feriados</h3>
            <button onClick={() => setShowHolidayModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm text-white">{h.name}</p>
                  <p className="text-xs text-white/50">{new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <button onClick={() => deleteHoliday(h.id)} className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          {holidays.length === 0 && <p className="text-sm text-white/40">Nenhum feriado cadastrado</p>}
        </div>
      </div>

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#1f2937] rounded-2xl border border-white/10 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Adicionar Feriado</h2>
              <button onClick={() => setShowHolidayModal(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white/50" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nome</label>
                <input value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Data</label>
                <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowHolidayModal(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5 transition">Cancelar</button>
                <button onClick={handleAddHoliday} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#c9a96e', color: '#000' }}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
