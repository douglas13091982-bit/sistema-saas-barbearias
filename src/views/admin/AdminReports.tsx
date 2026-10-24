// @ts-nocheck -- imported code, kept as written
import { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Download, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminReports() {
  const { appointments, services, barbers, clients, siteSettings } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const today = dateKey(now);
    return appointments.filter(a => {
      if (period === 'all') return true;
      const appointmentDate = String(a.date || '').slice(0, 10);
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        return appointmentDate >= dateKey(weekAgo) && appointmentDate <= today;
      }
      if (period === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return appointmentDate >= dateKey(monthAgo) && appointmentDate <= today;
      }
      return true;
    });
  }, [appointments, period]);

  const totalRevenue = filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => {
    const service = services.find(s => s.id === a.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const totalAppointments = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = filteredAppointments.filter(a => a.status === 'cancelled').length;

  // Revenue by service
  const revenueByService = services.map(s => ({
    name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
    revenue: filteredAppointments.filter(a => a.serviceId === s.id && a.status === 'completed').reduce((sum, a) => sum + s.price, 0),
    count: filteredAppointments.filter(a => a.serviceId === s.id).length,
  })).filter(s => s.count > 0).sort((a, b) => b.revenue - a.revenue);

  // Calcula o repasse sobre os cortes concluídos, de acordo com a regra definida para cada barbeiro.
  const appointmentsByBarber = barbers.map(b => {
    const barberAppointments = filteredAppointments.filter(a => a.barberId === b.id);
    const completed = barberAppointments.filter(a => a.status === 'completed');
    const haircutAppointments = completed.map(a => {
      const service = services.find(s => s.id === a.serviceId);
      const label = `${service?.name || ''} ${service?.category || ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return { appointment: a, service, isHaircut: label.includes('cort') };
    }).filter(item => item.isHaircut);
    const haircuts = haircutAppointments.length;
    const haircutRevenue = haircutAppointments.reduce((sum, item) => sum + (Number(item.service?.price) || 0), 0);
    const revenue = completed.reduce((sum, a) => {
      const service = services.find(s => s.id === a.serviceId);
      return sum + (Number(service?.price) || 0);
    }, 0);
    const commissionValue = b.commissionValue === null || b.commissionValue === undefined || b.commissionValue === ''
      ? null
      : Number(b.commissionValue);
    const commissionConfigured = commissionValue !== null
      && Number.isFinite(commissionValue)
      && commissionValue >= 0
      && (b.commissionType === 'fixed' || (b.commissionType === 'percentage' && commissionValue <= 100));
    const barberPayout = commissionConfigured
      ? b.commissionType === 'fixed'
        ? haircuts * commissionValue
        : haircutRevenue * commissionValue / 100
      : null;
    return {
      id: b.id,
      name: b.name,
      total: barberAppointments.length,
      completed: completed.length,
      haircuts,
      revenue,
      haircutRevenue,
      commissionType: b.commissionType,
      commissionValue,
      commissionConfigured,
      barberPayout,
      shopCutRevenue: commissionConfigured ? haircutRevenue - barberPayout : null,
    };
  }).sort((a, b) => b.revenue - a.revenue || b.haircuts - a.haircuts || a.name.localeCompare(b.name));

  // Daily appointments chart
  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; count: number; revenue: number }> = {};
    filteredAppointments.forEach(a => {
      if (!days[a.date]) days[a.date] = { date: a.date, count: 0, revenue: 0 };
      days[a.date].count++;
      if (a.status === 'completed') {
        const service = services.find(s => s.id === a.serviceId);
        days[a.date].revenue += service?.price || 0;
      }
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      date: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count: d.count,
      revenue: d.revenue
    }));
  }, [filteredAppointments, services]);

  const exportCSV = () => {
    const headers = ['Data', 'Horário', 'Cliente', 'Serviço', 'Barbeiro', 'Status', 'Valor'];
    const rows = filteredAppointments.map(a => {
      const client = clients.find(c => c.id === a.clientId);
      const service = services.find(s => s.id === a.serviceId);
      const barber = barbers.find(b => b.id === a.barberId);
      return [a.date, a.time, client?.name || '', service?.name || '', barber?.name || '', a.status, service?.price || 0];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Produção por barbeiro</h1>
          <p className="text-white/50 text-sm">Confira os cortes concluídos e o faturamento gerado por cada profissional.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value as any)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none">
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="all">Todo Período</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-4">
          <p className="text-xs text-white/50 mb-1">Faturamento</p>
          <p className="text-xl font-bold text-white">{siteSettings.currency} {totalRevenue.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-4">
          <p className="text-xs text-white/50 mb-1">Total Agendamentos</p>
          <p className="text-xl font-bold text-white">{totalAppointments}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-4">
          <p className="text-xs text-white/50 mb-1">Concluídos</p>
          <p className="text-xl font-bold text-green-400">{completedAppointments}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-4">
          <p className="text-xs text-white/50 mb-1">Cancelados</p>
          <p className="text-xl font-bold text-red-400">{cancelledAppointments}</p>
        </div>
      </div>

      {/* Barber Performance */}
      <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Produção e faturamento por barbeiro</h3>
          <p className="mt-1 text-sm text-white/50">Cortes de cabelo concluídos e faturamento bruto dos serviços no período selecionado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-3 text-white/50 font-medium">Barbeiro</th>
                <th className="text-right py-3 px-3 text-white/50 font-medium">Cortes concluídos</th>
                <th className="text-right py-3 px-3 text-white/50 font-medium">Serviços concluídos</th>
                <th className="text-right py-3 px-3 text-white/50 font-medium">Faturamento total</th>
                <th className="text-left py-3 px-3 text-white/50 font-medium">Regra de repasse</th>
                <th className="text-right py-3 px-3 text-white/50 font-medium">Repasse ao barbeiro</th>
                <th className="text-right py-3 px-3 text-white/50 font-medium">Parte da barbearia (cortes)</th>
              </tr>
            </thead>
            <tbody>
              {appointmentsByBarber.map(b => (
                <tr key={b.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="py-3 px-3 font-medium text-white">{b.name}</td>
                  <td className="py-3 px-3 text-right font-semibold text-white">{b.haircuts}</td>
                  <td className="py-3 px-3 text-right text-white/70">{b.completed}</td>
                  <td className="py-3 px-3 text-right text-white/70 whitespace-nowrap">
                    {siteSettings.currency} {b.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-white/70 whitespace-nowrap">
                    {b.commissionConfigured
                      ? b.commissionType === 'fixed'
                        ? `${siteSettings.currency} ${b.commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por corte`
                        : `${b.commissionValue}% do valor do corte`
                      : <a href="/admin/barbeiros" className="text-amber-300 underline underline-offset-2">Configurar em Barbeiros</a>}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold whitespace-nowrap" style={{ color: '#c9a96e' }}>
                    {b.barberPayout === null
                      ? '—'
                      : `${siteSettings.currency} ${b.barberPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </td>
                  <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${b.shopCutRevenue !== null && b.shopCutRevenue < 0 ? 'text-red-400' : 'text-white/80'}`}>
                    {b.shopCutRevenue === null
                      ? '—'
                      : `${siteSettings.currency} ${b.shopCutRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </td>
                </tr>
              ))}
              {appointmentsByBarber.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">Nenhum barbeiro cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-white/45">O repasse é calculado apenas para serviços cujo nome ou categoria indica corte e com status Concluído. O faturamento total inclui todos os serviços concluídos. Configure a regra de cada profissional em Barbeiros.</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Agendamentos por Dia</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="#c9a96e" strokeWidth={2} dot={false} name="Agendamentos" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-white/40 text-center py-10">Sem dados</p>}
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Faturamento por Serviço</h3>
          {revenueByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByService}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="revenue" fill="#c9a96e" radius={[4, 4, 0, 0]} name="Faturamento (R$)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-white/40 text-center py-10">Sem dados</p>}
        </div>
      </div>


    </div>
  );
}
