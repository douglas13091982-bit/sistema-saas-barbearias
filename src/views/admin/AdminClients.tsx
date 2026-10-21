import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, UserCircle, Ban, CheckCircle } from 'lucide-react';

export default function AdminClients() {
  const { clients, appointments, services, updateClient, siteSettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const filtered = clients.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s);
  });

  const selected = clients.find(c => c.id === selectedClient);
  const clientAppointments = selected ? appointments.filter(a => a.clientId === selected.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-white/50 text-sm">Gerencie seus clientes</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" placeholder="Buscar por nome, telefone ou e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-[#1f2937] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Telefone</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Visitas</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Total Gasto</th>
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id} onClick={() => setSelectedClient(client.id)} className={`border-b border-white/5 cursor-pointer transition ${selectedClient === client.id ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <td className="py-3 px-4 text-white font-medium">{client.name}</td>
                    <td className="py-3 px-4 text-white/70">{client.phone}</td>
                    <td className="py-3 px-4 text-white/70">{client.totalVisits}</td>
                    <td className="py-3 px-4 font-medium" style={{ color: '#c9a96e' }}>{siteSettings.currency} {client.totalSpent.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${client.blocked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {client.blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum cliente encontrado</p>
            </div>
          )}
        </div>

        {/* Client Detail */}
        <div className="rounded-xl border border-white/5 bg-[#1f2937] p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#c9a96e20', color: '#c9a96e' }}>
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selected.name}</h3>
                  <p className="text-xs text-white/50">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-white/50">Visitas</p>
                  <p className="text-lg font-bold text-white">{selected.totalVisits}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-white/50">Total Gasto</p>
                  <p className="text-lg font-bold" style={{ color: '#c9a96e' }}>R$ {selected.totalSpent}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateClient(selected.id, { blocked: !selected.blocked })} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${selected.blocked ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {selected.blocked ? <><CheckCircle className="w-3 h-3" /> Desbloquear</> : <><Ban className="w-3 h-3" /> Bloquear</>}
                </button>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-2">Histórico</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {clientAppointments.map(appt => {
                    const service = services.find(s => s.id === appt.serviceId);
                    return (
                      <div key={appt.id} className="p-2 rounded-lg bg-white/5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white">{service?.name}</span>
                          <span className="text-white/50">{new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    );
                  })}
                  {clientAppointments.length === 0 && <p className="text-xs text-white/40">Nenhum agendamento</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              <UserCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione um cliente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
