import { Link } from '@/lib/router-compat';
import { useData } from '../../contexts/DataContext';
import { LayoutDashboard, CalendarDays, Calendar, Scissors, Users, UserCircle, MessageSquare, Image, Home, Shield, BarChart3, Settings } from 'lucide-react';

export default function AdminHome() {
  const { isPlatformAdmin } = useData();
  const modules = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/admin/dashboard' },
    { label: 'Agendamentos', icon: Calendar, route: '/admin/agendamentos' },
    { label: 'Serviços', icon: Scissors, route: '/admin/servicos' },
    { label: 'Barbeiros', icon: Users, route: '/admin/barbeiros' },
    { label: 'Clientes', icon: UserCircle, route: '/admin/clientes' },
    { label: 'Depoimentos', icon: MessageSquare, route: '/admin/depoimentos' },
    { label: 'Galeria', icon: Image, route: '/admin/galeria' },
    { label: 'Conteúdo', icon: Home, route: '/admin/conteudo' },
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
          </Link>
        ))}
      </nav>
    </section>
  );
}
