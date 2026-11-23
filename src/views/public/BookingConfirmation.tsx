// @ts-nocheck -- imported code, kept as written
import { buttonRadius } from '@/lib/button-style';
import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '../../contexts/DataContext';
import { Link } from '@/lib/router-compat';
import { Check, Calendar, Clock, Scissors, User, MessageCircle, Home } from 'lucide-react';

export default function BookingConfirmation() {
  const { id } = useParams({ strict: false });
  return <BookingReceipt key={id} token={id} />;
}

export function BookingReceipt({ token }: { token: string }) {
  const { tenant, services, barbers, siteSettings, themeSettings } = useData();
  const theme = themeSettings;
  const [attempt, setAttempt] = useState(0);
  const [receipt,setReceipt] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(()=> {
    let active = true;
    setLoading(true); setError('');
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('booking_receipt', { receipt_token: token });
        if (error) throw error;
        if (active) setReceipt(data?.tenantId && data.tenantId !== tenant?.id ? null : data);
      } catch {
        if (active) setError('Não foi possível consultar o comprovante.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, tenant?.id, attempt]);
  const lastAppointment = receipt?.appointment;
  const service = services.find(s => s.id === lastAppointment?.serviceId);
  const barber = barbers.find(b => b.id === lastAppointment?.barberId);
  const client = receipt?.client;
  if(loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <p role="alert">{error}</p>
      <button type="button" className="rounded border px-4 py-2" onClick={() => setAttempt(previous => previous + 1)}>Consultar novamente</button>
    </div>
  );
  if(!lastAppointment) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><p>Agendamento não encontrado.</p><Link to="/">Voltar ao início</Link></div>;

  const cssVars = {
    '--color-primary': theme.primaryColor,
    '--color-secondary': theme.secondaryColor,
    '--color-accent': theme.accentColor,
    '--color-bg': theme.backgroundColor,
    '--color-button': theme.buttonColor,
    '--color-text': theme.textColor,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ ...cssVars, fontFamily: theme.fontFamily, backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6" style={{ backgroundColor: `${theme.accentColor}20` }}>
            <Check className="w-10 h-10" style={{ color: theme.accentColor }} />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Playfair Display' }}>Agendamento Confirmado!</h1>
          <p className="text-white/60">Seu horário foi reservado com sucesso. Estamos ansiosos para atendê-lo!</p>
        </div>

        {lastAppointment && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/50">Detalhes</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5" style={{ color: theme.accentColor }} />
                <div>
                  <span className="text-xs text-white/50">Serviço</span>
                  <p className="font-medium">{service?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" style={{ color: theme.accentColor }} />
                <div>
                  <span className="text-xs text-white/50">Barbeiro</span>
                  <p className="font-medium">{barber?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: theme.accentColor }} />
                <div>
                  <span className="text-xs text-white/50">Data</span>
                  <p className="font-medium">{new Date(lastAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" style={{ color: theme.accentColor }} />
                <div>
                  <span className="text-xs text-white/50">Horário</span>
                  <p className="font-medium">{lastAppointment.time} ({service?.duration} min)</p>
                </div>
              </div>
              {client && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5" style={{ color: theme.accentColor }} />
                  <div>
                    <span className="text-xs text-white/50">Cliente</span>
                    <p className="font-medium">{client.name}</p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-white/50">Valor</span>
                <span className="text-xl font-bold" style={{ color: theme.accentColor }}>{siteSettings.currency} {service?.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <a
            href={`https://wa.me/${siteSettings.whatsapp}?text=Olá! Gostaria de confirmar meu agendamento.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ borderRadius: buttonRadius(theme.buttonStyle, '12px'), backgroundColor: '#25D366', color: '#fff' }}
          >
            <MessageCircle className="w-5 h-5" /> Confirmar pelo WhatsApp
          </a>
          <Link
            to="/"
            style={{ borderRadius: buttonRadius(theme.buttonStyle, '12px') }}
            className="w-full py-3 rounded-xl font-semibold border border-white/20 flex items-center justify-center gap-2 transition-all hover:bg-white/5"
          >
            <Home className="w-5 h-5" /> Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
