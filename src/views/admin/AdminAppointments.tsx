import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Filter, Check, X, Clock, Eye, Ban, Calendar } from 'lucide-react';

export default function AdminAppointments() {
  const { appointments, services, barbers, clients, updateAppointment, siteSettings } = useData();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBarber, setFilterBarber] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);

  const filtered = appointments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterBarber !== 'all' && a.barberId !== filterBarber) return false;
    if (searchTerm) {
      const client = clients.find(c => c.id === a.clientId);
      const service = services.find(s => s.id === a.serviceId);
      const search = searchTerm.toLowerCase();
      if (!client?.name.toLowerCase().includes(search) && !service?.name.toLowerCase().includes(search)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    cancelled: 'bg-red-500/20 text-red-400',
    no_show: 'bg-gray-500/20 text-gray-400',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
          <p className="text-white/50 text-sm">Gerencie todos os agendamentos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por cliente ou serviço..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/30"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
          <option value="no_show">Não compareceu</option>
        </select>
        <select
          value={filterBarber}
          onChange={e => setFilterBarber(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none"
        >
          <option value="all">Todos os barbeiros</option>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-[#1f2937] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-white/50 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Serviço</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Barbeiro</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Data/Hora</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Valor</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-white/50 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => {
                const client = clients.find(c => c.id === appt.clientId);
                const service = services.find(s => s.id === appt.serviceId);
                const barber = barbers.find(b => b.id === appt.barberId);
                return (
                  <tr key={appt.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-white">{client?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-white/70">{service?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-white/70">{barber?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-white/70">
                      <div>{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs text-white/50">{appt.time}</div>
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: '#c9a96e' }}>{siteSettings.currency} {service?.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[appt.status]}`}>
                        {statusLabels[appt.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {appt.status === 'pending' && (
                          <button onClick={() => updateAppointment(appt.id, { status: 'confirmed' })} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition" title="Confirmar">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <>
                            <button onClick={() => updateAppointment(appt.id, { status: 'completed' })} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition" title="Concluir">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateAppointment(appt.id, { status: 'cancelled' })} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition" title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {appt.status === 'confirmed' && (
                          <button onClick={() => updateAppointment(appt.id, { status: 'no_show' })} className="p-1.5 rounded-lg hover:bg-gray-500/20 text-gray-400 transition" title="Não compareceu">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum agendamento encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
