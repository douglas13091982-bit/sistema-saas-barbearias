import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (handler: unknown) => handler,
    };
    return builder;
  },
}));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
const adminLoad = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client.server', () => {
  adminLoad();
  return { supabaseAdmin: {auth:{admin:{deleteUser:vi.fn()}}} };
});

import { manageStaff } from './staff.functions';

describe('Staff management permissions', () => {
  it('rejects non-administrators before loading privileged credentials', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false });
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({data:{tenant_id:'tenant-one'}}) };
    const from = vi.fn().mockReturnValue(query);
    const handler = manageStaff as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ data: { action: 'list' }, context: { userId: 'staff-account', supabase: { rpc, from } } }))
      .rejects.toThrow('Acesso restrito ao administrador.');
    expect(rpc).toHaveBeenCalledWith('tenant_admin', { tid: 'tenant-one' });
    expect(adminLoad).not.toHaveBeenCalled();
  });
  it('rejects a target from another shop before any account mutation', async () => {
    const first={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:{tenant_id:'tenant-one'}})};
    const target={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:null})};
    const from=vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(target);
    const handler=manageStaff as unknown as (input:unknown)=>Promise<unknown>;
    await expect(handler({data:{action:'delete',id:'foreign-account'},context:{userId:'owner-one',supabase:{from,rpc:vi.fn().mockResolvedValue({data:true})}}})).rejects.toThrow('Usuário não encontrado nesta barbearia.');
    expect(target.eq).toHaveBeenCalledWith('tenant_id','tenant-one');
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    expect(supabaseAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

});
