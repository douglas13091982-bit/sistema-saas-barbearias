import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function AdminSchedule() {
  const { appointments, services, barbers, clients, updateAppointment } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#22c55e',
    completed: '#6366f1',
    no_show: '#6b7280',
  };

  const navigateDate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-white/50 text-sm">Visualize e gerencie os agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('day')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'day' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>Dia</button>
          <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'week' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>Semana</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-white/70"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-semibold text-white">
          {view === 'day'
            ? currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
          }
        </h2>
        <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-white/10 text-white/70"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Day View */}
      {view === 'day' && (
        <div className="rounded-xl border border-white/5 bg-[#1f2937] overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr] border-b border-white/5">
                <div className="p-3 text-xs text-white/50 font-medium">Hora</div>
                <div className="grid grid-cols-3 border-l border-white/5">
                  {barbers.filter(b => b.active).map(b => (
                    <div key={b.id} className="p-3 text-center border-l border-white/5">
                      <p className="text-xs font-medium text-white truncate">{b.name.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Time slots */}
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_1fr] border-b border-white/5 min-h-[60px]">
                  <div className="p-2 text-xs text-white/40 flex items-start">{hour.toString().padStart(2, '0')}:00</div>
                  <div className="grid grid-cols-3 border-l border-white/5">
                    {barbers.filter(b => b.active).map(barber => {
                      const dateStr = currentDate.toISOString().split('T')[0];
                      const slotAppts = appointments.filter(a =>
                        a.barberId === barber.id &&
                        a.date === dateStr &&
                        a.status !== 'cancelled' &&
                        parseInt(a.time.split(':')[0]) === hour
                      );
                      return (
                        <div key={barber.id} className="border-l border-white/5 p-1 space-y-1">
                          {slotAppts.map(appt => {
                            const client = clients.find(c => c.id === appt.clientId);
                            const service = services.find(s => s.id === appt.serviceId);
                            return (
                              <div key={appt.id} className="p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition" style={{ backgroundColor: `${statusColors[appt.status]}20`, borderLeft: `3px solid ${statusColors[appt.status]}` }}>
                                <p className="font-medium text-white truncate">{client?.name}</p>
                                <p className="text-white/50 truncate">{service?.name} • {appt.time}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="rounded-xl border border-white/5 bg-[#1f2937] overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((day, idx) => {
              const dayAppts = getAppointmentsForDate(day);
              const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              return (
                <div key={idx} className={`border-r border-white/5 last:border-r-0 ${isToday ? 'bg-white/5' : ''}`}>
                  <div className="p-3 text-center border-b border-white/5">
                    <p className="text-xs text-white/50">{dayNames[day.getDay()]}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-[#c9a96e]' : 'text-white'}`}>{day.getDate()}</p>
                  </div>
                  <div className="p-2 space-y-1 min-h-[200px]">
                    {dayAppts.map(appt => {
                      const client = clients.find(c => c.id === appt.clientId);
                      const service = services.find(s => s.id === appt.serviceId);
                      return (
                        <div key={appt.id} className="p-2 rounded text-xs" style={{ backgroundColor: `${statusColors[appt.status]}15`, borderLeft: `2px solid ${statusColors[appt.status]}` }}>
                          <p className="font-medium text-white truncate">{appt.time} - {client?.name}</p>
                          <p className="text-white/50 truncate">{service?.name}</p>
                        </div>
                      );
                    })}
                    {dayAppts.length === 0 && <p className="text-xs text-white/20 text-center pt-4">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
