import { useData } from '@/contexts/DataContext';

export function AppointmentBadge() {
  const { unseenAppointments } = useData();
  if (!unseenAppointments) return null;

  return (
    <span
      className="ba-appointment-badge"
      aria-label={`${unseenAppointments} ${unseenAppointments === 1 ? 'agendamento novo' : 'agendamentos novos'}`}
    >
      {unseenAppointments > 99 ? '99+' : unseenAppointments}
    </span>
  );
}
