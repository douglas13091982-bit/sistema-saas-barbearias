import { ArrowUpRight, CalendarCheck2, Clock3 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { useData } from '../../contexts/DataContext';
import { LayoutDashboard, CalendarDays, Calendar, Scissors, Users, UserCircle, MessageSquare, Image, Home, Palette, Shield, BarChart3, Settings } from 'lucide-react';

export default function AdminHome() {
  const { isPlatformAdmin, appointments } = useData();
  const pendingAppointments = appointments.filter(item => item.status === 'pending').length;
  const today = new Date().toLocaleDateString('en-CA');
  const todayCount = appointments.filter(item => item.date === today && item.status !== 'cancelled').length;
  const completedCount = appointments.filter(item => item.date === today && item.status === 'completed').length;
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
      <div className="ba-hub-desktop-intro">
        <div className="ba-hub-intro-copy">
          <span className="ba-hub-kicker">CENTRAL DE GESTÃO <span aria-hidden="true">✦</span></span>
          <h1>Sua barbearia.<br/><em>Seu controle.</em></h1>
          <p>Um espaço para acompanhar o movimento do dia e acessar tudo o que faz seu negócio crescer.</p>
          <div className="ba-hub-hero-actions">
            <Link to="/admin/agenda">Abrir agenda <ArrowUpRight size={17}/></Link>
            <Link to="/admin/dashboard">Ver indicadores <ArrowUpRight size={17}/></Link>
          </div>
        </div>
        <div className="ba-hub-summary">
          <div className="ba-hub-summary-title"><CalendarCheck2 size={19}/><span>RESUMO DE HOJE</span></div>
          <div className="ba-hub-summary-value">{todayCount}<small>agendamentos</small></div>
          <div className="ba-hub-summary-foot"><Clock3 size={16}/><span>{pendingAppointments} pendentes</span><strong>{completedCount} concluídos</strong></div>
        </div>
      </div>
      <div className="ba-hub-modules-title"><div><span>ACESSO RÁPIDO</span><h2>Gerencie seu negócio</h2></div><p>Escolha uma área para começar</p></div>
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
