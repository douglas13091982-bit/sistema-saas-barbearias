export function isHaircutService(service: { name?: string; category?: string } | null | undefined): boolean {
  const label = `${service?.name || ''} ${service?.category || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return label.includes('cort');
}

export function countCompletedHaircuts(
  clientId: string,
  appointments: Array<{ clientId?: string; serviceId?: string; status?: string }>,
  services: Array<{ id: string; name?: string; category?: string }>,
): number {
  return appointments.filter(appointment => {
    if (appointment.clientId !== clientId || appointment.status !== 'completed') return false;
    return isHaircutService(services.find(service => service.id === appointment.serviceId));
  }).length;
}
