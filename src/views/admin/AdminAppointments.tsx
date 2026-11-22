import { useRef, useState, type CSSProperties } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Check, UserX, XCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { resolveSiteImage } from '@/lib/site-images';
import type { Appointment, Barber, Client, Service, SiteSettings } from '@/types';
import '@/styles/admin-appointments.css';

const statuses = {
  pending: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const shopDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const dayLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' });
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const rowHeight = 104;

function BarberPhoto({ barber }: { barber: Pick<Barber, 'name' | 'photo'> }) {
  const [failed, setFailed] = useState<string>();
  const source = resolveSiteImage(barber.photo);
  const initials = barber.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('');
  return <span className="appointments-avatar" aria-hidden="true">
    {source && source !== failed ? <img src={source} alt="" onError={() => setFailed(source)} /> : initials}
  </span>;
}

type Status = Appointment['status'];
type StatusAction = 'completed' | 'cancelled' | 'no_show';
type Booking = { appointment: Appointment; client?: Client; service?: Service; start: number; end: number };

function positionBookings(bookings: Booking[]) {
  const sorted = [...bookings].sort((a, b) => a.start - b.start || b.end - a.end);
  let lanes: number[] = [];
  let groupEnd = -1;
  let group: Array<Booking & { lane: number }> = [];
  const positioned: Array<Booking & { lane: number; laneCount: number }> = [];
  function flush() {
    positioned.push(...group.map(booking => ({ ...booking, laneCount: lanes.length })));
    lanes = [];
    group = [];
  }
  for (const booking of sorted) {
    if (booking.start >= groupEnd) {
      flush();
      groupEnd = booking.end;
    }
    const availableLane = lanes.findIndex(end => end <= booking.start);
    const lane = availableLane < 0 ? lanes.length : availableLane;
    lanes[lane] = booking.end;
    groupEnd = Math.max(groupEnd, booking.end);
    group.push({ ...booking, lane });
  }
  flush();
  return positioned;
}

export default function AdminAppointments() {
  const { appointments, services, barbers, clients, updateAppointment, siteSettings }: {
    appointments: Appointment[]; services: Service[]; barbers: Barber[]; clients: Client[]; siteSettings: SiteSettings;
    updateAppointment: (id: string, data: { status: Status }, expectedStatus: Status) => Promise<unknown>;
  } = useData();
  const [date, setDate] = useState(() => shopDate.format(new Date()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const updating = useRef(false);

  const day = new Date(date + 'T12:00:00Z');
  const bookings = appointments.filter(appointment => appointment.date === date).map(appointment => {
    const service = services.find(item => item.id === appointment.serviceId);
    const start = minutes(appointment.time);
    const end = start + (Number(service?.duration) || 30);
    return { appointment, service, start, end, client: clients.find(item => item.id === appointment.clientId) };
  });
  const bookedBarbers = new Set(bookings.map(({ appointment }) => appointment.barberId));
  const columns = barbers.filter(barber => barber.active || bookedBarbers.has(barber.id))
    .sort((a, b) => a.order - b.order);
  const missingIds = [...bookedBarbers].filter(id => !barbers.some(barber => barber.id === id));
  const team = [...columns, ...missingIds.map(id => ({ id, name: 'Barbeiro removido', photo: '' }))];
  const workHours = [
    ...(siteSettings.businessHours ?? []),
    ...columns.flatMap(barber => barber.workingHours ?? []),
  ].filter(hours => hours.active && hours.dayOfWeek === day.getUTCDay());
  const startHour = Math.floor(Math.min(480, ...workHours.map(hours => minutes(hours.start)), ...bookings.map(booking => booking.start)) / 60);
  const endHour = Math.ceil(Math.max(1080, ...workHours.map(hours => minutes(hours.end)), ...bookings.map(booking => booking.end)) / 60);
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const selected = bookings.find(({ appointment }) => appointment.id === selectedId);
  const status = selected?.appointment.status;
  const canUpdate = status === 'pending' || status === 'confirmed';

  function moveDay(offset: number) {
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + offset);
    setDate(next.toISOString().slice(0, 10));
  }

  async function changeStatus(next: StatusAction) {
    if (!selected || !canUpdate || updating.current) return;
    updating.current = true;
    setSaving(true);
    setError('');
    try {
      await updateAppointment(selected.appointment.id, { status: next }, selected.appointment.status);
      setPendingAction(null);
    } catch {
      setError('Não foi possível atualizar o agendamento. Confira o status e tente novamente.');
    } finally {
      updating.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="appointments">
      <h1>Agendamentos</h1>
      <div className="appointments-toolbar">
        <button type="button" aria-label="Dia anterior" onClick={() => moveDay(-1)}><ChevronLeft size={18} /></button>
        <label className="appointments-date">
          <CalendarDays size={16} aria-hidden="true" /><span>{dayLabel.format(day)}</span>
          <input type="date" aria-label="Escolher data" value={date} onClick={event => { try { event.currentTarget.showPicker?.(); } catch { /* Keep the native date control available. */ } }} onChange={event => { if (event.target.value) setDate(event.target.value); }} />
        </label>
        <button type="button" aria-label="Próximo dia" onClick={() => moveDay(1)}><ChevronRight size={18} /></button>
        <button type="button" onClick={() => setDate(shopDate.format(new Date()))}>Hoje</button>
      </div>

      {!team.length ? <p>Nenhum barbeiro cadastrado para exibir na agenda.</p> : (
        <div className="appointments-scroll" role="region" aria-label="Grade de horários por barbeiro" tabIndex={0}>
          <div className="appointments-grid" style={{ '--barbers': team.length, '--hour-height': `${rowHeight}px` } as CSSProperties}>
            <div className="appointments-axis">
              <div className="appointments-heading">Horário</div>
              {hours.map(hour => <div key={hour} className="appointments-hour">{clock(hour * 60)}</div>)}
            </div>
            {team.map(barber => (
              <div className="appointments-column" key={barber.id}>
                <div className="appointments-heading"><BarberPhoto barber={barber} /><span>{barber.name}</span></div>
                <div className="appointments-column-slots" style={{ height: hours.length * rowHeight }}>
                  {positionBookings(bookings.filter(booking => booking.appointment.barberId === barber.id)).map(({ appointment, client, start, end, lane, laneCount }) => (
                    <button
                      type="button"
                      className="appointments-card"
                      key={appointment.id}
                      data-status={appointment.status}
                      aria-label={`${client?.name || 'Cliente'}, ${clock(start)} a ${clock(end)}, ${statuses[appointment.status]}`}
                      style={{
                        top: (start / 60 - startHour) * rowHeight,
                        height: Math.max(16, (end - start) / 60 * rowHeight - 2),
                        left: `calc(${lane / laneCount * 100}% + 2px)`,
                        width: `calc(${100 / laneCount}% - 4px)`,
                      }}
                      onClick={event => {
                        trigger.current = event.currentTarget;
                        setError('');
                        setPendingAction(null);
                        setSelectedId(appointment.id);
                      }}
                    >
                      <span>{clock(start)}–{clock(end)}</span>
                      <strong>{client?.name || 'Cliente'}</strong>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={open => { if (!open && !saving) setSelectedId(null); }}>
        {selected && <DialogContent className="appointments-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
          <DialogTitle>Detalhes do agendamento</DialogTitle>
          <DialogDescription className="sr-only">Informações e status da reserva.</DialogDescription>
          <dl>
            <dt>Cliente</dt><dd>{selected.client?.name || '—'}</dd>
            <dt>Telefone</dt><dd>{selected.client?.phone || '—'}</dd>
            <dt>Barbeiro</dt><dd>{team.find(barber => barber.id === selected.appointment.barberId)?.name || '—'}</dd>
            <dt>Serviço</dt><dd>{selected.service?.name || '—'}</dd>
            <dt>Horário</dt><dd>{clock(selected.start)}–{clock(selected.end)}</dd>
            <dt>Valor</dt><dd>{selected.service ? `${siteSettings.currency} ${Number(selected.service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</dd>
            {selected.appointment.notes && <><dt>Observações</dt><dd>{selected.appointment.notes}</dd></>}
          </dl>
          <p className="appointments-status" data-status={status} role="status">{statuses[selected.appointment.status]}</p>
          {canUpdate && <div className="appointments-actions">
            {pendingAction ? <>
              <p>Registrar como <strong>{statuses[pendingAction].toLowerCase()}</strong>?</p>
              <button type="button" disabled={saving} onClick={() => void changeStatus(pendingAction)}>{saving ? 'Salvando…' : 'Salvar status'}</button>
              <button type="button" disabled={saving} onClick={() => { setPendingAction(null); setError(''); }}>Voltar</button>
            </> : <>
              <button type="button" onClick={() => setPendingAction('completed')}><Check size={16} /> Concluir atendimento</button>
              <button type="button" data-action="no_show" onClick={() => setPendingAction('no_show')}><UserX size={16} /> Marcar como não compareceu</button>
              <button type="button" data-action="cancelled" onClick={() => setPendingAction('cancelled')}><XCircle size={16} /> Cancelar agendamento</button>
            </>}
          </div>}
          {error && <p role="alert">{error}</p>}
          <p className="appointments-note">Só atendimentos concluídos entram no faturamento.</p>
        </DialogContent>}
      </Dialog>
    </section>
  );
}
