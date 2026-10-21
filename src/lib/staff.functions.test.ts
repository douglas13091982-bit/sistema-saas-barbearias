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
  return { supabaseAdmin: {} };
});

import { manageStaff } from './staff.functions';

describe('Staff management permissions', () => {
  it('rejects non-administrators before loading privileged credentials', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false });
    const handler = manageStaff as unknown as (input: unknown) => Promise<unknown>;
    await expect(handler({ data: { action: 'list' }, context: { userId: 'staff-account', supabase: { rpc } } }))
      .rejects.toThrow('Acesso restrito ao administrador.');
    expect(rpc).toHaveBeenCalledWith('has_role', { _user_id: 'staff-account', _role: 'admin' });
    expect(adminLoad).not.toHaveBeenCalled();
  });
});