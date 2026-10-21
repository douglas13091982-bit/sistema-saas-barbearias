import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const billingAction = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator(z.object({ action: z.enum(['status','checkout','sync','cancel']), barberId: z.string().min(1).max(100).optional() }))
 .handler(async ({ data, context }) => {
  const { data: membership } = await context.supabase.from('user_roles').select('tenant_id,role,active').eq('user_id',context.userId).maybeSingle();
  if (!membership?.active || membership.role!=='admin') throw new Error('Acesso restrito ao proprietário da barbearia.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db: any = supabaseAdmin;
  const { mercado, billingReady, reconcileSubscription, reconcileAuthorizedPayment } = await import('@/lib/mercadopago.server');
  if (data.action==='status') return { ready: billingReady() };
  if (!data.barberId) throw new Error('Selecione o barbeiro.');
  const { data: sub } = await db.from('barber_subscriptions').select('*').eq('tenant_id',membership.tenant_id).eq('barber_id',data.barberId).maybeSingle();
  if (!sub) throw new Error('Barbeiro não encontrado.');
  if (!billingReady()) throw new Error('A plataforma precisa configurar a integração Mercado Pago antes de receber pagamentos.');
  if (data.action==='cancel') {
    if (sub.provider_id) await mercado(`/preapproval/${encodeURIComponent(sub.provider_id)}`,'PUT',{ status:'cancelled' });
    else if (sub.state==='creating' || sub.state==='review') throw new Error('Esta cobrança precisa ser conciliada antes do cancelamento.');
    const { error } = await db.from('barber_subscriptions').update({ state:'cancelled',checkout_url:null }).eq('id',sub.id);
    if(error) throw new Error('Não foi possível salvar o cancelamento. Consulte novamente antes de excluir.');
    return { cancelled:true };
  }
  if(data.action==='sync') {
    if(!sub.provider_id) throw new Error('Nenhuma assinatura foi identificada. Use o botão de pagamento para recuperar o checkout.');
    await reconcileSubscription(db,sub);
    let offset=0;
    for(let page=0;page<20;page++) {
      const invoices=await mercado(`/authorized_payments/search?preapproval_id=${encodeURIComponent(sub.provider_id)}&limit=100&offset=${offset}`);
      for(const invoice of invoices.results || []) await reconcileAuthorizedPayment(db,String(invoice.id));
      if((invoices.results || []).length<100) break;
      offset+=100;
    }
    return { synced:true };
  }
  const { data: claimed, error: claimError } = await context.supabase.rpc('claim_barber_checkout',{ bid:data.barberId });
  if(claimError || !claimed) throw new Error(claimError?.message || 'Não foi possível preparar o pagamento.');
  const claim=claimed as any;
  if(claim.provider_id) {
    const remote=await reconcileSubscription(db,claim);
    if(remote?.status==='authorized') return { authorized:true };
    if(remote?.status==='cancelled' || remote?.status==='paused') throw new Error('Assinatura sem cobrança ativa. Consulte a plataforma antes de reativar.');
    return { url:claim.checkout_url };
  }
  let remote;
  if(!claim.can_create) {
    const found=await mercado(`/preapproval/search?external_reference=${encodeURIComponent(claim.id)}`);
    const matches=(found.results || []).filter((item:any)=>String(item.external_reference)===claim.id);
    if(matches.length!==1) throw new Error('O checkout está em conciliação. Aguarde e consulte novamente; uma segunda cobrança não será criada.');
    remote=matches[0];
  } else {
    const {data:tenant}=await db.from('tenants').select('name,trial_ends_at').eq('id',membership.tenant_id).single();
    const {data:account}=await context.supabase.auth.getUser();
    const origin=new URL(process.env['APP_URL']!).origin;
    if(!origin.startsWith('https://')) throw new Error('Configure uma URL HTTPS para a plataforma.');
    remote=await mercado('/preapproval','POST',{
      reason:`Agenda mensal de barbeiro — ${tenant.name}`.slice(0,120), external_reference:claim.id,payer_email:account.user?.email,
      auto_recurring:{frequency:1,frequency_type:'months',transaction_amount:claim.amount_cents/100,currency_id:'BRL',...(new Date(tenant.trial_ends_at).getTime()>Date.now()?{start_date:new Date(tenant.trial_ends_at).toISOString()}:{})},
      back_url:`${origin}/admin/mensalidade`,status:'pending',
    },claim.id);
  }
  if(!remote?.id || String(remote.external_reference)!==claim.id || !remote.init_point || remote.auto_recurring?.currency_id!=='BRL' || Math.round(Number(remote.auto_recurring?.transaction_amount)*100)!==claim.amount_cents) throw new Error('Não foi possível confirmar o checkout. Consulte novamente para conciliar.');
  const checkout=new URL(remote.init_point);
  if(checkout.protocol!=='https:' || !/(^|\.)mercadopago\.com(\.br)?$/.test(checkout.hostname)) throw new Error('Endereço de pagamento inválido.');
  const {error:saveError}=await db.from('barber_subscriptions').update({provider_id:remote.id,checkout_url:checkout.href,state:remote.status==='authorized'?'authorized':'pending'}).eq('id',claim.id).is('provider_id',null);
  if(saveError) throw new Error('Checkout criado, mas aguardando conciliação. Consulte novamente antes de pagar.');
  return {url:checkout.href};
 });

export const platformBillingStatus = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const {data:allowed}=await context.supabase.rpc('is_platform_admin');
  if(!allowed) throw new Error('Acesso restrito ao superadministrador.');
  const {billingReady}=await import('@/lib/mercadopago.server');
  return {ready:billingReady(),webhookPath:'/api/mercadopago/webhook'};
});
