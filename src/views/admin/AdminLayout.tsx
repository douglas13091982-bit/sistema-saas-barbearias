// @ts-nocheck -- imported code, kept as written
import { useState, useEffect } from 'react';
import { AdminPanelSwitcher } from '@/components/AdminPanelSwitcher';
import { SiteImage } from '@/components/SiteImage';
import { useData } from '../../contexts/DataContext';
import '@/styles/barbershop-admin.css';
import { Outlet, NavLink, useNavigate, Navigate } from '@/lib/router-compat';
import { LayoutDashboard, Calendar, CalendarDays, Scissors, Users, UserCircle, Clock, Palette, MessageSquare, Image, Shield, BarChart3, Settings, LogOut, Menu, X, ChevronDown, Home } from 'lucide-react';

export default function AdminLayout() {
  const { currentUser, isAuthenticated, logout, siteSettings, themeSettings, tenant, isPlatformAdmin, appointments } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = themeSettings;
  const pendingAppointments = appointments.filter(appointment => appointment.status === 'pending').length;

  useEffect(() => {
    if (!sidebarOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [sidebarOpen]);

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  const handleLogout = async () => { await logout(); navigate('/admin/login', {replace:true}); };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/agenda', icon: CalendarDays, label: 'Agenda' },
    { to: '/admin/agendamentos', icon: Calendar, label: 'Agendamentos' },
    { to: '/admin/servicos', icon: Scissors, label: 'Serviços' },
    { to: '/admin/barbeiros', icon: Users, label: 'Barbeiros' },
    { to: '/admin/clientes', icon: UserCircle, label: 'Clientes' },
    { to: '/admin/depoimentos', icon: MessageSquare, label: 'Depoimentos' },
    { to: '/admin/galeria', icon: Image, label: 'Galeria' },
    { to: '/admin/conteudo', icon: Home, label: 'Conteúdo' },
    { to: '/admin/tema', icon: Palette, label: 'Personalização' },
    { to: '/admin/usuarios', icon: Shield, label: 'Usuários' },
    { to: '/admin/relatorios', icon: BarChart3, label: 'Produção por barbeiro' },
    { to: '/admin/mensalidade', icon: Calendar, label: 'Mensalidade' },
    ...(isPlatformAdmin ? [{ to: '/super-admin', icon: Shield, label: 'Superadministrador' }] : []),
    { to: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="ba-shell min-h-screen flex" style={{ backgroundColor: '#101010', fontFamily: theme.fontFamily, '--ba-accent': theme.accentColor || '#c9a96e' } as React.CSSProperties}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <button type="button" aria-label="Fechar navegação" className="ba-overlay fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside id="admin-navigation" aria-label="Menu administrativo" className={`ba-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1f2937] border-r border-white/5 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="ba-brand p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              {siteSettings.logo ? <SiteImage src={siteSettings.logo} alt={`Logo ${siteSettings.barbershopName}`} className="h-10 w-12 shrink-0 object-contain" /> : <Scissors className="w-6 h-6" style={{ color: theme.accentColor }} />}
              <span className="font-bold text-white" style={{ fontFamily: 'Playfair Display' }}>{siteSettings.barbershopName}</span>
            </div>
            <p className="text-xs text-white/40 mt-1">GESTÃO DA BARBEARIA</p>
            <button type="button" aria-label="Fechar menu" className="ba-close lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></button>
          </div>

          <nav aria-label="Seções do painel" className="ba-nav flex-1 overflow-y-auto py-4 px-3">
            <p className="ba-nav-label">Seu negócio</p>
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `ba-nav-item ${isActive ? 'ba-active' : ''} flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${isActive ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.to === '/admin/agendamentos' && pendingAppointments > 0 && (
                  <span aria-label={`${pendingAppointments} agendamentos pendentes`} aria-live="polite" className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm shadow-red-950/50">
                    {pendingAppointments > 99 ? '99+' : pendingAppointments}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: theme.accentColor, color: '#000' }}>
                {currentUser?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-white/40 capitalize">{currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'attendant' ? 'Atendente' : 'Barbeiro'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="ba-topbar sticky top-0 z-30 bg-[#111827]/80 backdrop-blur-md border-b border-white/5 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <button aria-label="Abrir menu administrativo" aria-expanded={sidebarOpen} aria-controls="admin-navigation" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
              {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
            <div className="ba-topbar-label"><span>Painel administrativo</span><p>{siteSettings.barbershopName}</p></div>
            <div className="flex items-center gap-3">
              <a href={tenant ? `/${tenant.slug}` : "/"} target="_blank" rel="noopener noreferrer" className="text-xs text-white/50 hover:text-white transition flex items-center gap-1">
                <Home className="w-3 h-3" /> Ver Site
              </a>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="admin-main" className="ba-content flex-1 p-4 lg:p-6 overflow-y-auto">
          <AdminPanelSwitcher active="shop" />
          {tenant && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"><span>Site da barbearia: <a className="underline" href={'/'+tenant.slug} target="_blank" rel="noopener noreferrer">/{tenant.slug}</a></span><a href="/admin/mensalidade" className="text-[#c9a96e]">{new Date(tenant.trial_ends_at)>new Date() ? 'Teste grátis até '+new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR') : 'Consultar agendas e mensalidades'}</a></div>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
