import { Link } from '@/lib/router-compat';
import { useData } from '../../contexts/DataContext';
import { LayoutDashboard, CalendarDays, Calendar, Scissors, Users, UserCircle, MessageSquare, Image, Home, Palette, Shield, BarChart3, Settings } from 'lucide-react';

export default function AdminHome() {
  const { isPlatformAdmin, appointments } = useData();
  const pendingAppointments = appointments.filter(item => item.status === 'pending').length;
  const modules = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/admin/dashboard' },
    { label: 'Agenda', icon: CalendarDays, route: '/admin/agenda' },
    { label: 'Agendamentos', icon: Calendar, route: '/admin/agendamentos', badge: pendingAppointments },
    { label: 'Serviços', icon: Scissors, route: '/admin/servicos' },
    { label: 'Barbeiros', icon: Users, route: '/admin/barbeiros' },
    { label: 'Clientes', icon: UserCircle, route: '/admin/clientes' },
    { label: 'Depoimentos', icon: MessageSquare, route: '/admin/depoimentos' },
    { label: 'Galeria', icon: Image, route: '/admin/galeria' },
    { label: 'Conteúdo', icon: Home, route: '/admin/conteudo' },
    { label: 'Personalização', icon: Palette, route: '/admin/tema' },
    { label: 'Usuários', icon: Shield, route: '/admin/usuarios' },
    { label: 'Produção', icon: BarChart3, route: '/admin/relatorios' },
    { label: 'Mensalidade', icon: CalendarDays, route: '/admin/mensalidade' },
    ...(isPlatformAdmin ? [{ label: 'Super Admin', icon: Shield, route: '/super-admin' }] : []),
    { label: 'Configurações', icon: Settings, route: '/admin/configuracoes' },
  ];

  return (
    <section className="ba-home-hub" aria-label="Módulos do painel administrativo">
      <nav className="ba-home-module-grid" aria-label="Módulos administrativos">
        {modules.map(module => (
          <Link key={module.route} to={module.route} className="ba-home-module-card">
            <module.icon aria-hidden="true" />
            <span>{module.label}</span>
            {!!module.badge && <small aria-label={`${module.badge} agendamentos pendentes`}>{module.badge > 99 ? '99+' : module.badge}</small>}
          </Link>
        ))}
      </nav>
    </section>
  );
}
