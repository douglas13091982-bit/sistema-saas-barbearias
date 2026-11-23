import { useEffect, useState } from 'react';
import type { Appointment } from '@/types';

const shopDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

function readSeen(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function useAppointmentNotifications(tenantId: string | undefined, userId: string | undefined, appointments: Appointment[]) {
  const key = tenantId && userId ? `agenda-seen:${tenantId}:${userId}` : '';
  const [seen, setSeen] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] });

  useEffect(() => {
    if (!key) return;
    setSeen({ key, ids: readSeen(key) });
    function sync(event: StorageEvent) {
      if (event.key === key || event.key === null) setSeen({ key, ids: readSeen(key) });
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);

  const today = shopDay.format(new Date());
  const seenIds = new Set(seen.key === key ? seen.ids : []);
  const unseenAppointments = key && seen.key === key ? appointments.filter(appointment =>
    appointment.date >= today &&
    (appointment.status === 'pending' || appointment.status === 'confirmed') &&
    !seenIds.has(appointment.id)
  ).length : 0;

  function markAppointmentSeen(id: string) {
    if (!key || seenIds.has(id)) return;
    const ids = [...new Set([...seenIds, ...readSeen(key), id])];
    setSeen({ key, ids });
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // The current tab can still acknowledge the notification.
    }
  }

  return { unseenAppointments, markAppointmentSeen };
}
