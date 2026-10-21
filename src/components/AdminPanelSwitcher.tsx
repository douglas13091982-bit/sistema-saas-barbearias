import { useData } from '@/contexts/DataContext';
import { Building2, ShieldCheck } from 'lucide-react';

export function AdminPanelSwitcher({ active }: { active: 'platform' | 'shop' }) {
  const { isPlatformAdmin, currentUser, tenant } = useData();
  if (!isPlatformAdmin) return null;
  const canManageShop = currentUser?.role === 'admin' && tenant;
  return <nav aria-label="Alternar painel administrativo" className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-[#c9a96e]/30 bg-[#191918] p-3 text-sm text-white">
    <span className="mr-2 text-xs text-white/60">Alternar painel</span>
    <a href="/super-admin" aria-current={active === 'platform' ? 'page' : undefined}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2"
      style={{ borderColor: active === 'platform' ? '#c9a96e' : '#ffffff25', background: active === 'platform' ? '#c9a96e20' : 'transparent', color: '#e5cf9e' }}>
      <ShieldCheck size={17} aria-hidden="true" /> Super Admin
    </a>
    {canManageShop && <a href="/admin/dashboard" aria-current={active === 'shop' ? 'page' : undefined}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2"
      style={{ borderColor: active === 'shop' ? '#c9a96e' : '#ffffff25', background: active === 'shop' ? '#c9a96e20' : 'transparent', color: '#e5cf9e' }}>
      <Building2 size={17} aria-hidden="true" /> Minha barbearia · {tenant.name}
    </a>}
  </nav>;
}
