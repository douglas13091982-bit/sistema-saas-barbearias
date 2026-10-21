import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const billingAction = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator(z.object({ action: z.enum(['status','prepare','subscribe','checkout','sync','cancel']), barberId: z.string().min(1).max(100).optional(), cardToken: z.string().min(8).max(256).regex(/^[A-Za-z0-9_-]+$/).optional() }))
 .handler(async ({ data, context }) => {
  const { data: membership } = await context.supabase.from('user_roles').select('tenant_id,role,active').eq('user_id',context.userId).maybeSingle();
  if (!membership?.active || membership.role!=='admin') throw new Error('Acesso restrito ao proprietário da barbearia.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db: any = supabaseAdmin;
  const { mercado, billingReady, getMercadoConfig, reconcileSubscription, reconcileAuthorizedPayment } = await import('@/lib/mercadopago.server');
  if (data.action==='status') { const config=await getMercadoConfig();return { ready: await billingReady(), publicKey:config.publicKey }; }
  if (!data.barberId) throw new Error('Selecione o barbeiro.');
  const { data: sub } = await db.from('barber_subscriptions').select('*').eq('tenant_id',membership.tenant_id).eq('barber_id',data.barberId).maybeSingle();
  if (!sub) throw new Error('Barbeiro não encontrado.');
  if (!await billingReady()) throw new Error('A plataforma precisa configurar a integração Mercado Pago no painel Super Admin antes de receber pagamentos.');
  if (data.action==='cancel') {
    if (sub.provider_id) await mercado(`/preapproval/${encodeURIComponent(sub.provider_id)}`,'PUT',{ status:'cancelled' });
    else if (sub.state==='creating' || sub.state==='review') throw new Error('Esta cobrança precisa ser conciliada antes do cancelamento.');
    const { error } = await db.from('barber_subscriptions').update({ state:'cancelled',checkout_url:null }).eq('id',sub.id);
    if(error) throw new Error('Não foi possível salvar o cancelamento. Consulte novamente antes de excluir.');
    return { cancelled:true };
  }
  if(data.action==='sync') {
    if(!sub.provider_id) {
      const found=await mercado(`/preapproval/search?external_reference=${encodeURIComponent(sub.id)}`);
      const matches=(found.results || []).filter((item:any)=>String(item.external_reference)===sub.id);
      if(matches.length!==1) throw new Error('Ainda não há confirmação do Mercado Pago. Aguarde alguns instantes e consulte novamente.');
      const remote=matches[0];
      if(!remote.id || remote.auto_recurring?.currency_id!=='BRL' || Math.round(Number(remote.auto_recurring?.transaction_amount)*100)!==sub.amount_cents) throw new Error('A assinatura encontrada precisa de análise da plataforma.');
      const {error}=await db.from('barber_subscriptions').update({provider_id:String(remote.id),checkout_url:null,state:['pending','authorized','paused','cancelled'].includes(remote.status)?remote.status:'review'}).eq('id',sub.id).is('provider_id',null);
      if(error) throw new Error('Não foi possível conciliar esta assinatura.');
      await reconcileSubscription(db,{...sub,provider_id:String(remote.id)});
      return {synced:true};
    }
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
  if(data.action==='prepare') {
    const {data:claimed,error:claimError}=await context.supabase.rpc('claim_barber_checkout',{bid:data.barberId});
    if(claimError||!claimed) throw new Error(claimError?.message||'Não foi possível preparar o pagamento.');
    const claim=claimed as any;
    if(claim.provider_id) {
      const remote=await reconcileSubscription(db,claim);
      if(remote?.status==='authorized') return {authorized:true};
      return {legacyUrl:claim.checkout_url||remote?.init_point||null,legacy:true,state:remote?.status||claim.state};
    }
    const mpConfig=await getMercadoConfig();
    if(!mpConfig.publicKey) throw new Error('A plataforma ainda não configurou a chave pública do Mercado Pago.');
    const {data:tenant}=await db.from('tenants').select('name,trial_ends_at').eq('id',membership.tenant_id).single();
    const {data:barber}=await db.from('barbershop_records').select('data').eq('tenant_id',membership.tenant_id).eq('kind','barbers').eq('id',data.barberId).single();
    const {data:account}=await context.supabase.auth.getUser();
    if(!account.user?.email) throw new Error('Sua conta precisa ter um e-mail para criar a assinatura.');
    return {prepared:true,amountCents:claim.amount_cents,barberName:String(barber?.data?.name||'Barbeiro'),payerEmail:account.user.email,trialEndsAt:tenant?.trial_ends_at||null,publicKey:mpConfig.publicKey};
  }
  if(data.action==='subscribe') {
    if(!data.cardToken) throw new Error('Não foi possível tokenizar o cartão. Revise os dados e tente novamente.');
    const {data:claimed,error:claimError}=await context.supabase.rpc('claim_barber_checkout',{bid:data.barberId});
    if(claimError||!claimed) throw new Error(claimError?.message||'Não foi possível validar a mensalidade.');
    const claim=claimed as any;
    if(claim.provider_id) return {legacy:true,legacyUrl:claim.checkout_url||null};
    const found=await mercado(`/preapproval/search?external_reference=${encodeURIComponent(claim.id)}`);
    const matches=(found.results||[]).filter((item:any)=>String(item.external_reference)===claim.id);
    if(matches.length>1) throw new Error('Há mais de uma assinatura pendente para este barbeiro. A plataforma precisa conciliá-las antes de continuar.');
    let remote=matches[0];
    if(!remote) {
      const {data:tenant}=await db.from('tenants').select('name,trial_ends_at').eq('id',membership.tenant_id).single();
      const {data:account}=await context.supabase.auth.getUser();
      if(!account.user?.email) throw new Error('Sua conta precisa ter um e-mail para criar a assinatura.');
      const origin=new URL((await getMercadoConfig()).appUrl).origin;
      if(!origin.startsWith('https://')) throw new Error('Configure uma URL HTTPS para a plataforma.');
      const trialEnd=new Date(tenant.trial_ends_at);
      remote=await mercado('/preapproval','POST',{
        reason:`Agenda mensal de barbeiro — ${tenant.name}`.slice(0,120),external_reference:claim.id,payer_email:account.user.email,card_token_id:data.cardToken,
        auto_recurring:{frequency:1,frequency_type:'months',transaction_amount:claim.amount_cents/100,currency_id:'BRL',...(trialEnd.getTime()>Date.now()?{start_date:trialEnd.toISOString()}:{})},
        back_url:`${origin}/admin/mensalidade`,status:'authorized',
      },claim.id);
    }
    if(!remote?.id||String(remote.external_reference)!==claim.id||remote.auto_recurring?.currency_id!=='BRL'||Math.round(Number(remote.auto_recurring?.transaction_amount)*100)!==claim.amount_cents) throw new Error('O Mercado Pago ainda não confirmou esta assinatura. Consulte novamente antes de tentar outra cobrança.');
    const state=['pending','authorized','paused','cancelled'].includes(remote.status)?remote.status:'review';
    const {error:saveError}=await db.from('barber_subscriptions').update({provider_id:String(remote.id),checkout_url:null,state}).eq('id',claim.id).is('provider_id',null);
    if(saveError) throw new Error('Assinatura criada, mas aguardando conciliação. Use Consultar pagamento antes de tentar novamente.');
    return {authorized:state==='authorized',pending:state==='pending',state};
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
      const origin=new URL((await getMercadoConfig()).appUrl).origin;
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
  const {data:config,error}=await (context.supabase as any).rpc('platform_mercado_pago_config_status');
  if(error) throw new Error('Não foi possível consultar as configurações seguras do Mercado Pago.');
  return {ready:await billingReady(),config,webhookPath:'/api/mercadopago/webhook'};
});

const platformConfigInput=z.object({accessToken:z.string().max(512).optional().default(''),webhookSecret:z.string().max(512).optional().default(''),publicKey:z.string().max(256).optional().default(''),appUrl:z.string().max(255).optional().default('')});
export const savePlatformMercadoConfig=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(platformConfigInput).handler(async({data,context})=>{
  const {data:allowed}=await context.supabase.rpc('is_platform_admin');
  if(!allowed) throw new Error('Acesso restrito ao superadministrador.');
  const {data:status,error}=await (context.supabase as any).rpc('platform_save_mercado_pago_config',{p_access_token:data.accessToken,p_webhook_secret:data.webhookSecret,p_public_key:data.publicKey,p_app_url:data.appUrl});
  if(error) throw new Error(error.message||'Não foi possível salvar as credenciais.');
  return {config:status};
});
