import { useData } from '../../contexts/DataContext';
import { Calendar, DollarSign, Users, Scissors, TrendingUp, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { appointments, services, barbers, clients, siteSettings } = useData();
  const today = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled');
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= weekStart && d <= weekEnd && a.status !== 'cancelled';
  });

  const totalRevenue = appointments.filter(a => a.status === 'completed').reduce((sum, a) => {
    const service = services.find(s => s.id === a.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const weekRevenue = weekAppointments.reduce((sum, a) => {
    const service = services.find(s => s.id === a.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
  const cancelRate = appointments.length > 0 ? ((cancelledCount / appointments.length) * 100).toFixed(1) : '0';

  // Service popularity
  const servicePopularity = services.map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
    count: appointments.filter(a => a.serviceId === s.id).length,
    fullName: s.name
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  // Barber workload
  const barberWorkload = barbers.filter(b => b.active).map(b => ({
    name: b.name.split(' ')[0],
    appointments: appointments.filter(a => a.barberId === b.id && a.status !== 'cancelled').length
  })).sort((a, b) => b.appointments - a.appointments);

  const COLORS = ['#c9a96e', '#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

  // Recent clients
  const recentClients = [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Agendamentos Hoje', value: todayAppointments.length, icon: Calendar, color: '#6366f1' },
    { label: 'Faturamento Total', value: `${siteSettings.currency} ${totalRevenue.toFixed(0)}`, icon: DollarSign, color: '#22c55e' },
    { label: 'Faturamento Semanal', value: `${siteSettings.currency} ${weekRevenue.toFixed(0)}`, icon: TrendingUp, color: '#f59e0b' },
    { label: 'Total Clientes', value: clients.length, icon: Users, color: '#8b5cf6' },
    { label: 'Agendamentos Semana', value: weekAppointments.length, icon: Clock, color: '#06b6d4' },
    { label: 'Taxa Cancelamento', value: `${cancelRate}%`, icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/50 text-sm">Visão geral do seu negócio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Popularity */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Serviços Mais Populares</h3>
          {servicePopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={servicePopularity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="count" fill="#c9a96e" radius={[4, 4, 0, 0]} name="Agendamentos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-center py-10">Nenhum dado disponível</p>
          )}
        </div>

        {/* Barber Workload */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Carga dos Barbeiros</h3>
          {barberWorkload.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={barberWorkload} cx="50%" cy="50%" outerRadius={80} dataKey="appointments" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {barberWorkload.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/40 text-center py-10">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Agendamentos de Hoje</h3>
          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.map(appt => {
                const client = clients.find(c => c.id === appt.clientId);
                const service = services.find(s => s.id === appt.serviceId);
                const barber = barbers.find(b => b.id === appt.barberId);
                return (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-white">{appt.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{client?.name}</p>
                      <p className="text-xs text-white/50">{service?.name} • {barber?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      appt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      appt.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {appt.status === 'pending' ? 'Pendente' : appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Não compareceu'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-center py-6">Nenhum agendamento para hoje</p>
          )}
        </div>

        {/* Recent Clients */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Clientes Recentes</h3>
          <div className="space-y-3">
            {recentClients.map(client => (
              <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#c9a96e20', color: '#c9a96e' }}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{client.name}</p>
                  <p className="text-xs text-white/50">{client.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">{client.totalVisits} visitas</p>
                  <p className="text-xs font-medium" style={{ color: '#c9a96e' }}>R$ {client.totalSpent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
