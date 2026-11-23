// @ts-nocheck -- imported code, kept as written
import { buttonRadius } from '@/lib/button-style';
import { supabase } from '@/integrations/supabase/client';
import { safeSubscriptionUrl } from '@/lib/subscription-link';
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookingReceipt } from './BookingConfirmation';
import { SiteImage } from '@/components/SiteImage';
import { useData } from '../../contexts/DataContext';
import { useSearchParams, Link, Navigate } from '@/lib/router-compat';
import { Scissors, Clock, ChevronLeft, Calendar, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Booking() {
  const { tenant, services } = useData();
  const [searchParams] = useSearchParams();
  const requestedService = searchParams.get('service');
  const preferredBarber = searchParams.get('barber');
  const selectedService = services.find(service =>
    service.id === requestedService && service.active && !safeSubscriptionUrl(service.subscriptionUrl)
  );

  if (!tenant) return <main className="saas-page"><h1>Barbearia não encontrada ou indisponível.</h1><a href="/">Voltar</a></main>;

  const serviceSection = `/${tenant.slug}?reservar=sim${preferredBarber ? `&barber=${encodeURIComponent(preferredBarber)}` : ''}#servicos`;
  if (!selectedService) return <Navigate to={serviceSection} replace />;

  return <BookingFlow key={`${tenant.id}:${selectedService.id}:${preferredBarber ?? ''}`} selectedService={selectedService.id} preferredBarber={preferredBarber} serviceSection={serviceSection} />;
}

function BookingFlow({ selectedService, preferredBarber, serviceSection }: {
  selectedService: string;
  preferredBarber: string | null;
  serviceSection: string;
}) {
  const { tenant, bookingAccess, services, barbers, appointments, siteSettings, themeSettings, holidays } = useData();
  const navigate = useNavigate();
  const theme = themeSettings;
  const submission = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptToken, setReceiptToken] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState(preferredBarber || 'any');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const activeBarbers = barbers.filter(b => b.active && bookingAccess[b.id]).sort((a, b) => a.order - b.order);

  const filteredBarbers = useMemo(() => {
    if (!selectedService) return activeBarbers;
    return activeBarbers.filter(b => b.serviceIds.includes(selectedService));
  }, [selectedService, activeBarbers]);

  const availableTimes = useMemo(() => {
    if (!selectedDate || !selectedBarber) return [];
    const barber = selectedBarber === 'any' ? filteredBarbers[0] : activeBarbers.find(b => b.id === selectedBarber);
    if (!barber) return [];

    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();

    const shopHours = siteSettings.businessHours?.find(day => day.dayOfWeek === dayOfWeek);
    if (Array.isArray(siteSettings.businessHours) && !shopHours?.active) return [];

    // Check holiday
    const isHoliday = holidays.some(h => h.active && h.date === selectedDate);
    if (isHoliday) return [];

    // Check barber's working hours
    const wh = barber.workingHours.find(w => w.dayOfWeek === dayOfWeek && w.active);
    if (!wh) return [];

    // Check day off
    if (barber.daysOff.includes(selectedDate)) return [];

    const service = services.find(s => s.id === selectedService);
    if (!service) return [];

    const barberStartMinutes = parseInt(wh.start.split(':')[0]) * 60 + parseInt(wh.start.split(':')[1]);
    const barberEndMinutes = parseInt(wh.end.split(':')[0]) * 60 + parseInt(wh.end.split(':')[1]);
    const shopStartMinutes = shopHours?.active ? parseInt(shopHours.start.split(':')[0]) * 60 + parseInt(shopHours.start.split(':')[1]) : barberStartMinutes;
    const shopEndMinutes = shopHours?.active ? parseInt(shopHours.end.split(':')[0]) * 60 + parseInt(shopHours.end.split(':')[1]) : barberEndMinutes;
    const startMinutes = Math.max(barberStartMinutes, shopStartMinutes);
    const interval = Math.max(Number(siteSettings.intervalMinutes) || 15, 1);

    const times: string[] = [];
    for (let m = barberStartMinutes; m + service.duration <= Math.min(barberEndMinutes, shopEndMinutes); m += interval) {
      if (m < startMinutes) continue;
      const hours = Math.floor(m / 60).toString().padStart(2, '0');
      const mins = (m % 60).toString().padStart(2, '0');
      const timeStr = `${hours}:${mins}`;

      // Check if already booked
      const barberAppointments = appointments.filter(a =>
        a.barberId === barber.id &&
        a.date === selectedDate &&
        a.status !== 'cancelled'
      );

      const serviceDuration = service.duration;
      const endSlotMinutes = m + serviceDuration;

      const hasConflict = barberAppointments.some(a => {
        const aStart = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
        const aService = services.find(s => s.id === a.serviceId);
        const aEnd = aStart + (aService?.duration || 30);
        return m < aEnd && endSlotMinutes > aStart;
      });

      // Check if time is in the past
      const now = new Date();
      const slotDate = new Date(selectedDate + 'T' + timeStr + ':00');
      const minAdvance = siteSettings.minAdvanceHours * 60 * 60 * 1000;
      if (slotDate.getTime() - now.getTime() < minAdvance) continue;

      if (!hasConflict) {
        times.push(timeStr);
      }
    }
    return times;
  }, [selectedDate, selectedBarber, selectedService, appointments, barbers, services, siteSettings, holidays, activeBarbers]);

  // Generate calendar dates
  const calendarDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isHoliday = holidays.some(h => h.active && h.date === dateStr);
      const shopHours = siteSettings.businessHours?.find(day => day.dayOfWeek === d.getDay());
      const shopIsOpen = !Array.isArray(siteSettings.businessHours) || !!shopHours?.active;
      if (!isHoliday && shopIsOpen) {
        dates.push(dateStr);
      }
    }
    return dates;
  }, [holidays, siteSettings.businessHours]);

  const handleSubmit = async () => {
    if (submission.current || receiptToken) return;
    const barber = selectedBarber === 'any' ? filteredBarbers[0] : filteredBarbers.find(item => item.id === selectedBarber);
    if (!tenant || !barber) {
      setSubmitError('Este barbeiro não está disponível para agendamento.');
      return;
    }
    if (!clientName.trim() || !clientPhone.trim() || !selectedDate || !selectedTime) {
      setSubmitError('Confira o nome, o telefone, a data e o horário antes de confirmar.');
      return;
    }

    submission.current = true;
    setSubmitting(true);
    setSubmitError('');
    let token: string;
    try {
      const { data, error } = await supabase.rpc('book_appointment', {
        input: {
          tenantId: tenant.id, name: clientName.trim(), phone: clientPhone.trim(), email: clientEmail, notes: clientNotes,
          serviceId: selectedService, barberId: barber.id, date: selectedDate, time: selectedTime,
        },
      });
      if (error) throw error;
      if (typeof data?.token !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(data.token)) {
        throw new Error('O servidor não enviou um comprovante válido. Consulte a barbearia antes de tentar novamente.');
      }
      token = data.token;
    } catch (error) {
      setSubmitError(error?.message || 'Não foi possível reservar o horário.');
      return;
    } finally {
      submission.current = false;
      setSubmitting(false);
    }

    // Keep the receipt visible even if the router cannot replace the booking URL.
    setReceiptToken(token);
    try {
      await navigate({
        to: '/$slug/confirmacao/$id',
        params: { slug: tenant.slug, id: token },
        search: {},
        replace: true,
      });
    } catch {
      // The receipt remains available in this view.
    }
  };

  if (receiptToken) return <BookingReceipt token={receiptToken} />;

  const cssVars = {
    '--color-primary': theme.primaryColor,
    '--color-secondary': theme.secondaryColor,
    '--color-accent': theme.accentColor,
    '--color-bg': theme.backgroundColor,
    '--color-button': theme.buttonColor,
    '--color-text': theme.textColor,
  } as React.CSSProperties;

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedBarberData = activeBarbers.find(b => b.id === selectedBarber);

  return (
    <div className="min-h-screen" style={{ ...cssVars, fontFamily: theme.fontFamily, backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={serviceSection} className="flex items-center gap-2 text-white/70 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5" style={{ color: theme.accentColor }} />
            <span className="font-bold" style={{ fontFamily: 'Playfair Display' }}>{siteSettings.barbershopName}</span>
          </div>
          <div className="text-sm text-white/50">Passo {step} de 3</div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%`, backgroundColor: theme.accentColor }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {submitError && <p role="alert" className="text-destructive mb-4">{submitError}</p>}
        {/* Step 1: Choose Barber */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>Escolha o Barbeiro</h2>
            <p className="text-white/60 mb-6">Serviço selecionado: <strong className="text-white">{selectedServiceData?.name}</strong></p>
            {filteredBarbers.length === 0 && <p role="status" className="mb-4 text-white/70">Nenhum barbeiro disponível para este serviço.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBarbers.length > 0 && <button
                onClick={() => { setSelectedBarber('any'); setStep(2); }}
                className="text-left p-5 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${theme.accentColor}20` }}>
                    🎲
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Qualquer barbeiro</h3>
                    <p className="text-white/60 text-sm">Alocaremos o melhor disponível</p>
                  </div>
                </div>
              </button>}
              {filteredBarbers.map(barber => (
                <button
                  key={barber.id}
                  onClick={() => { setSelectedBarber(barber.id); setStep(2); }}
                  className={`text-left p-5 rounded-xl border transition-all hover:scale-[1.02] ${selectedBarber === barber.id ? 'border-opacity-100' : 'border-white/10 hover:border-white/30'}`}
                  style={{ borderColor: selectedBarber === barber.id ? theme.accentColor : undefined, backgroundColor: selectedBarber === barber.id ? `${theme.accentColor}15` : 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-4">
                    <SiteImage src={barber.photo} alt={barber.name} className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: theme.accentColor }} />
                    <div>
                      <h3 className="font-bold text-lg">{barber.name}</h3>
                      <p className="text-sm" style={{ color: theme.accentColor }}>{barber.specialty}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-start">
              <Link to={serviceSection} className="flex items-center gap-2 text-white/60 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" /> Trocar serviço
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Choose Date & Time */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>Escolha Data e Horário</h2>
            <p className="text-white/60 mb-8">Selecione o dia e horário disponíveis</p>

            {/* Date Selection */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: theme.accentColor }} /> Data
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {calendarDates.map(date => {
                  const d = new Date(date + 'T12:00:00');
                  return (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                      className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all ${selectedDate === date ? 'scale-105' : 'hover:bg-white/10'}`}
                      style={{ backgroundColor: selectedDate === date ? theme.accentColor : 'rgba(255,255,255,0.05)', color: selectedDate === date ? '#000' : theme.textColor }}
                    >
                      <div className="text-xs opacity-70">{dayNames[d.getDay()]}</div>
                      <div className="text-xl font-bold">{d.getDate()}</div>
                      <div className="text-xs opacity-70">{monthNames[d.getMonth()].substring(0, 3)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: theme.accentColor }} /> Horário
                </h3>
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); }}
                        className={`py-3 rounded-xl text-center font-medium transition-all ${selectedTime === time ? 'scale-105' : 'hover:bg-white/10'}`}
                        style={{ backgroundColor: selectedTime === time ? theme.accentColor : 'rgba(255,255,255,0.05)', color: selectedTime === time ? '#000' : theme.textColor }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
                    <p>Nenhum horário disponível para esta data.</p>
                    <p className="text-sm mt-2">Tente outro dia ou barbeiro.</p>
                  </div>
                )}
              </div>
            )}

            {selectedTime && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ borderRadius: buttonRadius(theme.buttonStyle, '12px'), backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-start">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-white/60 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Client Info & Confirmation */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display' }}>Seus Dados</h2>
            <p className="text-white/60 mb-8">Preencha suas informações para confirmar o agendamento</p>

            {/* Summary */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/50">Resumo do Agendamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/50">Serviço:</span>
                  <p className="font-medium">{selectedServiceData?.name}</p>
                </div>
                <div>
                  <span className="text-white/50">Barbeiro:</span>
                  <p className="font-medium">{selectedBarber === 'any' ? 'Qualquer disponível' : selectedBarberData?.name}</p>
                </div>
                <div>
                  <span className="text-white/50">Data:</span>
                  <p className="font-medium">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div>
                  <span className="text-white/50">Horário:</span>
                  <p className="font-medium">{selectedTime}</p>
                </div>
                <div>
                  <span className="text-white/50">Duração:</span>
                  <p className="font-medium">{selectedServiceData?.duration} minutos</p>
                </div>
                <div>
                  <span className="text-white/50">Valor:</span>
                  <p className="font-medium" style={{ color: theme.accentColor }}>{siteSettings.currency} {selectedServiceData?.price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Client Form */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp *</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">E-mail (opcional)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                <textarea
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Alguma preferência ou observação?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder:text-white/30 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 text-white/60 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !clientName || !clientPhone}
                className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ borderRadius: buttonRadius(theme.buttonStyle, '12px'), backgroundColor: theme.buttonColor, color: theme.darkMode ? '#000' : '#fff' }}
              >
                <Check className="w-5 h-5" /> {submitting ? 'Salvando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
