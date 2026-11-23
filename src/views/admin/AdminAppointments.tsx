import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronRight, RefreshCw, Check, UserX, XCircle, ExternalLink, X } from 'lucide-react';
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
const dayLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const formatDay = (date: string) => dayLabel.format(new Date(date + 'T12:00:00Z'));
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

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
type Period = 'upcoming' | 'all' | 'date';

export default function AdminAppointments() {
  const { appointments, services, barbers, clients, updateAppointment, siteSettings, refresh, markAppointmentSeen, tenant }: {
    appointments: Appointment[]; services: Service[]; barbers: Barber[]; clients: Client[]; siteSettings: SiteSettings;
    refresh: () => Promise<boolean>; markAppointmentSeen: (id: string) => void; tenant: { slug: string } | null;
    updateAppointment: (id: string, data: { status: Status }, expectedStatus: Status) => Promise<unknown>;
  } = useData();
  const today = shopDate.format(new Date());
  const [period, setPeriod] = useState<Period>('upcoming');
  const [date, setDate] = useState(today);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [sidePanel, setSidePanel] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1180px)');
    const sync = () => setSidePanel(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (selectedId && sidePanel) closeButton.current?.focus();
  }, [selectedId, sidePanel]);

  const trigger = useRef<HTMLButtonElement | null>(null);
  const updating = useRef(false);

  const { team, bookingsByBarber } = useMemo(() => {
    const visible = appointments.filter(appointment => {
      if (period === 'date') return appointment.date === date;
      if (period === 'upcoming') return appointment.date >= today;
      return true;
    });
    visible.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const bookingsByBarber = new Map<string, Appointment[]>();
    for (const appointment of visible) {
      const bookings = bookingsByBarber.get(appointment.barberId) ?? [];
      bookings.push(appointment);
      bookingsByBarber.set(appointment.barberId, bookings);
    }

    const team: Pick<Barber, 'id' | 'name' | 'photo'>[] = barbers.filter(barber => barber.active || bookingsByBarber.has(barber.id))
      .sort((a, b) => a.order - b.order);
    for (const id of bookingsByBarber.keys()) {
      if (!barbers.some(barber => barber.id === id)) team.push({ id, name: 'Barbeiro removido', photo: '' });
    }
    return { team, bookingsByBarber };
  }, [appointments, barbers, date, period, today]);

  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const selected = appointments.find(appointment => appointment.id === selectedId);
  const selectedClient = selected && clientById.get(selected.clientId);
  const selectedService = selected && services.find(service => service.id === selected.serviceId);
  const selectedBarber = selected && barbers.find(barber => barber.id === selected.barberId);
  const status = selected?.status;
  const canUpdate = status === 'pending' || status === 'confirmed';

  async function refreshAgenda() {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      const updated = await refresh();
      setRefreshMessage(updated ? 'Agenda atualizada.' : 'Não foi possível atualizar a agenda. Tente novamente.');
    } catch {
      setRefreshMessage('Não foi possível atualizar a agenda. Tente novamente.');
    } finally {
      setRefreshing(false);
    }
  }

  async function changeStatus(next: StatusAction) {
    if (!selected || !canUpdate || updating.current) return;
    updating.current = true;
    setSaving(true);
    setError('');
    try {
      await updateAppointment(selected.id, { status: next }, selected.status);
      setPendingAction(null);
    } catch {
      setError('Não foi possível atualizar o agendamento. Confira o status e tente novamente.');
    } finally {
      updating.current = false;
      setSaving(false);
    }
  }

  function closeDetails() {
    if (saving) return;
    setSelectedId(null);
    if (sidePanel) trigger.current?.focus();
  }

  const details = selected && <>
    <dl>
      <dt>Cliente</dt><dd>{selectedClient?.name || '—'}</dd>
      <dt>Telefone</dt><dd>{selectedClient?.phone || '—'}</dd>
      <dt>Barbeiro</dt><dd>{selectedBarber?.name || 'Barbeiro removido'}</dd>
      <dt>Serviço</dt><dd>{selectedService?.name || '—'}</dd>
      <dt>Data</dt><dd>{formatDay(selected.date)}</dd>
      <dt>Horário</dt><dd>{selected.time.slice(0, 5)}–{clock(minutes(selected.time) + (Number(selectedService?.duration) || 30))}</dd>
      <dt>Valor</dt><dd>{selectedService ? `${siteSettings.currency} ${Number(selectedService.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</dd>
      {selected.notes && <><dt>Observações</dt><dd>{selected.notes}</dd></>}
    </dl>
    <p className="appointments-status" data-status={status} role="status">{statuses[selected.status]}</p>
    {canUpdate && <div className="appointments-actions">
      {pendingAction ? <>
        <p>Registrar como <strong>{statuses[pendingAction].toLowerCase()}</strong>?</p>
        <button type="button" disabled={saving} onClick={() => void changeStatus(pendingAction)}>{saving ? 'Salvando…' : 'Salvar status'}</button>
        <button type="button" disabled={saving} onClick={() => { setPendingAction(null); setError(''); }}>Voltar</button>
      </> : <>
        <button type="button" data-action="completed" onClick={() => setPendingAction('completed')}><Check size={16} /> Concluir atendimento</button>
        <button type="button" data-action="no_show" onClick={() => setPendingAction('no_show')}><UserX size={16} /> Marcar como não compareceu</button>
        <button type="button" data-action="cancelled" onClick={() => setPendingAction('cancelled')}><XCircle size={16} /> Cancelar agendamento</button>
      </>}
    </div>}
    {error && <p role="alert">{error}</p>}
    <p className="appointments-note">Só atendimentos concluídos entram no faturamento.</p>
  </>;

  return (
    <section className="appointments">
      <h1 className="sr-only">Agendamentos</h1>
      <div className="appointments-toolbar">
        <label className="appointments-filter">
          <span className="sr-only">Período</span>
          <CalendarDays className="appointments-filter-icon" size={17} aria-hidden="true" />
          <select value={period} onChange={event => setPeriod(event.target.value as Period)}>
            <option value="upcoming">Hoje e próximos dias</option>
            <option value="date">Escolher data</option>
            <option value="all">Todas as datas</option>
          </select>
        </label>
        {period === 'date' && (
          <label className="appointments-filter">
            <span>Data</span>
            <input type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} />
          </label>
        )}
        <button className="appointments-refresh" type="button" disabled={refreshing} onClick={() => void refreshAgenda()}>
          <RefreshCw size={16} aria-hidden="true" /> {refreshing ? 'Atualizando…' : 'Atualizar agenda'}
        </button>
        <a className="appointments-site" href={tenant ? `/${tenant.slug}` : '/'} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} aria-hidden="true" /> Ver site
        </a>
      </div>
      {refreshMessage && <p role="status" className="mb-3 text-sm">{refreshMessage}</p>}

      <div className="appointments-workspace">
        {!team.length ? <p>Nenhum barbeiro cadastrado para exibir na agenda.</p> : (
          <div className="appointments-scroll" role="region" aria-label="Quadro de agendamentos por barbeiro" tabIndex={0}>
            <div className="appointments-board">
              {team.map(barber => {
                const bookings = bookingsByBarber.get(barber.id) ?? [];
                return (
                  <section className="appointments-column" key={barber.id} aria-label={barber.name}>
                    <header className="appointments-heading">
                      <BarberPhoto barber={barber} />
                      <h2>{barber.name}</h2>
                      <span className="appointments-count" aria-label={`${bookings.length} agendamentos`}>{bookings.length}</span>
                    </header>
                    {bookings.length === 0 ? <p className="appointments-empty"><CalendarDays size={30} aria-hidden="true" />Sem agendamentos neste período.</p> : (
                      <ul className="appointments-cards">
                        {bookings.map(appointment => (
                          <li key={appointment.id}>
                            <button
                              type="button"
                              className="appointments-card"
                              data-status={appointment.status}
                              aria-pressed={selectedId === appointment.id}
                              disabled={saving}
                              onClick={event => {
                                trigger.current = event.currentTarget;
                                setError('');
                                setPendingAction(null);
                                markAppointmentSeen(appointment.id);
                                setSelectedId(appointment.id);
                              }}
                            >
                              <span className="appointments-card-date"><CalendarDays size={14} aria-hidden="true" /> {formatDay(appointment.date)} · {appointment.time.slice(0, 5)}</span>
                              <strong>{clientById.get(appointment.clientId)?.name || 'Cliente'}</strong>
                              <span className="appointments-card-status">{statuses[appointment.status]}</span>
                              <ChevronRight className="appointments-card-arrow" size={17} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {selected && sidePanel && (
          <aside className="appointments-details" aria-labelledby="appointment-details-heading"
            onKeyDown={event => { if (event.key === 'Escape') closeDetails(); }}>
            <header>
              <h2 id="appointment-details-heading">Detalhes do agendamento</h2>
              <button ref={closeButton} type="button" aria-label="Fechar detalhes" disabled={saving} onClick={closeDetails}><X size={20} /></button>
            </header>
            {details}
          </aside>
        )}
      </div>

      <Dialog open={!!selected && !sidePanel} onOpenChange={open => { if (!open) closeDetails(); }}>
        {selected && !sidePanel && <DialogContent className="appointments-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
          <DialogTitle>Detalhes do agendamento</DialogTitle>
          <DialogDescription className="sr-only">Informações e status da reserva.</DialogDescription>
          {details}
        </DialogContent>}
      </Dialog>
    </section>
  );
}
