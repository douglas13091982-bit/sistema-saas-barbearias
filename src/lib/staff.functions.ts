import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const manageStaff = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(['list','create','update','delete']), id: z.string().optional(), user: z.object({ name: z.string(), email: z.string().email(), password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').optional(), role: z.enum(['admin','attendant','barber']), active: z.boolean() }).optional() }))
  .handler(async ({ data, context }) => {
    const { data: membership } = await context.supabase.from('user_roles').select('tenant_id').eq('user_id',context.userId).maybeSingle();
    const { data: admin } = await context.supabase.rpc('tenant_admin',{tid:membership?.tenant_id || '00000000-0000-0000-0000-000000000000'});
    if (!admin || !membership) throw new Error('Acesso restrito ao administrador.');
    const tenantId=membership.tenant_id;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    if (data.action === 'list') {
      const { data: roles, error } = await context.supabase.from('user_roles').select('*').eq('tenant_id',tenantId);
      if (error) throw new Error('Não foi possível carregar os usuários.');
      return Promise.all((roles ?? []).map(async r => {
        const { data: account } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        return { id:r.user_id,role:r.role,active:r.active,name:account.user?.user_metadata?.['name'] || account.user?.email,email:account.user?.email,createdAt:account.user?.created_at };
      }));
    }
    if(data.action!=='create') {
      const {data:target}=await context.supabase.from('user_roles').select('user_id').eq('tenant_id',tenantId).eq('user_id',data.id || '').maybeSingle();
      if(!target) throw new Error('Usuário não encontrado nesta barbearia.');
    }
    if (data.id === context.userId) throw new Error('Não é possível alterar seu próprio acesso nesta tela.');
    if (data.action === 'delete' && data.id) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
      if (error) throw new Error('Não foi possível excluir o usuário.');
      return [];
    }
    const user = data.user;
    if (data.action === 'create' && !user?.password) throw new Error('Informe uma senha para o novo usuário.');
    if (!user) throw new Error('Dados incompletos.');
    const attributes = { email: user.email, ...(user.password ? { password: user.password } : {}), user_metadata: { name: user.name } };
    const result = data.action === 'create'
      ? await supabaseAdmin.auth.admin.createUser({...attributes,email_confirm:true})
      : await supabaseAdmin.auth.admin.updateUserById(data.id ?? '', attributes);
    if (result.error || !result.data.user) throw new Error('Não foi possível salvar o usuário. Verifique o e-mail e a senha.');
    const { error } = await supabaseAdmin.from('user_roles').upsert({ user_id: result.data.user.id, role: user.role, active: user.active, tenant_id: tenantId }, { onConflict: 'user_id' });
    if (error) throw new Error('Não foi possível salvar as permissões.');
    return [];
  });
