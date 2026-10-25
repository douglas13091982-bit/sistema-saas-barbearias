import { useData } from '@/contexts/DataContext';
import { Building2, ShieldCheck } from 'lucide-react';

export function AdminPanelSwitcher({ active }: { active: 'platform' | 'shop' }) {
  const { isPlatformAdmin, currentUser, tenant } = useData();
  if (!isPlatformAdmin && !tenant) return null;
  const canManageShop = isPlatformAdmin && currentUser?.role === 'admin' && tenant;
  const trialIsActive = tenant && new Date(tenant.trial_ends_at) > new Date();
  const trialLabel = tenant
    ? trialIsActive
      ? `Teste grátis até ${new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')}`
      : 'Consultar agendas e mensalidades'
    : '';

  return (
    <nav aria-label={isPlatformAdmin ? 'Alternar painel administrativo' : 'Informações da barbearia'} className="ba-panel-switcher mb-5">
      {isPlatformAdmin && <span className="ba-panel-switcher-label">Alternar painel</span>}
      {isPlatformAdmin && (
        <a href="/super-admin" aria-current={active === 'platform' ? 'page' : undefined} className={`ba-panel-switcher-action ${active === 'platform' ? 'is-active' : ''}`}>
          <ShieldCheck size={17} aria-hidden="true" /> Super Admin
        </a>
      )}
      {canManageShop && (
        <a href="/admin" aria-current={active === 'shop' ? 'page' : undefined} className={`ba-panel-switcher-action ${active === 'shop' ? 'is-active' : ''}`}>
          <Building2 size={17} aria-hidden="true" /> Minha barbearia · {tenant.name}
        </a>
      )}
      {tenant && (
        <div className="ba-panel-switcher-meta">
          <a href={`/${tenant.slug}`} target="_blank" rel="noopener noreferrer">Site da barbearia: /{tenant.slug}</a>
          <a href="/admin/mensalidade">{trialLabel}</a>
        </div>
      )}
    </nav>
  );
}
