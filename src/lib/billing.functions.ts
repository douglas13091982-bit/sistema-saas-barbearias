import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { isValidCpf, safeDescription } from '@/lib/cpf';

export const billingAction = createServerFn({ method: 'POST' })
 .middleware([requireSupabaseAuth])
 .inputValidator(z.object({ action: z.enum(['status','prepare','subscribe','checkout','sync','cancel']), barberId: z.string().min(1).max(100).optional(), cardToken: z.string().min(8).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(), paymentMethod:z.enum(['pix','boleto']).optional(), payer:z.object({firstName:z.string().trim().min(1).max(80),lastName:z.string().trim().min(1).max(80),cpf:z.string().regex(/^\d{11}$/).refine(isValidCpf,'CPF inválido. Confira os 11 números.'),zipCode:z.string().regex(/^\d{8}$/).optional(),street:z.string().trim().min(2).max(120).optional(),number:z.string().trim().min(1).max(20).optional(),neighborhood:z.string().trim().min(2).max(80).optional(),city:z.string().trim().min(2).max(80).optional(),state:z.string().regex(/^[A-Z]{2}$/).optional()}).optional() }))
 .handler(async ({ data, context }) => {
  const { data: membership } = await context.supabase.from('user_roles').select('tenant_id,role,active').eq('user_id',context.userId).maybeSingle();
  if (!membership?.active || membership.role!=='admin') throw new Error('Acesso restrito ao proprietário da barbearia.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db: any = supabaseAdmin;
  const { mercado, mercadoOrders, getMercadoConfig, reconcileSubscription, reconcileAuthorizedPayment, reconcileTransparentOrder } = await import('@/lib/mercadopago.server');
  if (data.action==='status') {
    const config=await getMercadoConfig();
    const cardReady=Boolean(config.accessToken&&config.webhookSecret&&config.publicKey&&config.appUrl);
    const transparentReady=Boolean(config.ordersAccessToken&&config.ordersWebhookSecret);
    return {ready:cardReady&&transparentReady,cardReady,transparentReady,publicKey:config.publicKey};
  }
  if (!data.barberId) throw new Error('Selecione o barbeiro.');
  const { data: sub } = await db.from('barber_subscriptions').select('*').eq('tenant_id',membership.tenant_id).eq('barber_id',data.barberId).maybeSingle();
  if (!sub) throw new Error('Barbeiro não encontrado.');
  const mpConfig=await getMercadoConfig();
  const cardReady=Boolean(mpConfig.accessToken&&mpConfig.webhookSecret&&mpConfig.publicKey&&mpConfig.appUrl);
  const transparentReady=Boolean(mpConfig.ordersAccessToken&&mpConfig.ordersWebhookSecret);
  if ((data.action==='prepare'||data.action==='subscribe')&&!cardReady) throw new Error('O pagamento com cartão ainda não está configurado pela plataforma.');
  if (data.action==='checkout'&&!transparentReady) throw new Error('Pix e boleto ainda não estão configurados pela plataforma.');
  if ((data.action==='sync'||data.action==='cancel')&&sub.provider_id&&!mpConfig.accessToken) throw new Error('A aplicação de Assinaturas do Mercado Pago ainda não está configurada.');
  if (data.action==='cancel') {
    if (sub.provider_id) await mercado(`/preapproval/${encodeURIComponent(sub.provider_id)}`,'PUT',{ status:'cancelled' });
    else if (sub.state==='creating' || sub.state==='review') throw new Error('Esta cobrança precisa ser conciliada antes do cancelamento.');
    const { error } = await db.from('barber_subscriptions').update({ state:'cancelled',checkout_url:null }).eq('id',sub.id);
    if(error) throw new Error('Não foi possível salvar o cancelamento. Consulte novamente antes de excluir.');
    return { cancelled:true };
  }
  if(data.action==='sync') {
    if(!sub.provider_id) {
      if(!mpConfig.ordersAccessToken) throw new Error('A aplicação de Checkout Transparente ainda não está configurada.');
      const {data:attempt}=await db.from('subscription_payment_orders').select('provider_order_id').eq('subscription_id',sub.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
      let orderState:string|null=null;
      if(attempt?.provider_order_id) orderState=(await reconcileTransparentOrder(db,attempt.provider_order_id))?.attempt?.state||null;
      const {data:fresh}=await db.from('barber_subscriptions').select('paid_until').eq('id',sub.id).single();
      return {synced:true,state:orderState,paid:!!fresh?.paid_until&&new Date(fresh.paid_until).getTime()>Date.now()};
    }
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
  if(data.action==='checkout') {
    if(!data.paymentMethod) throw new Error('Escolha Pix ou boleto.');
    if(sub.provider_id) {
      const remote=await reconcileSubscription(db,sub);
      if(remote?.status==='authorized') return {authorized:true};
      if(remote?.init_point) return {legacyUrl:remote.init_point,legacy:true};
      throw new Error('Esta assinatura precisa ser conciliada pela plataforma antes de criar outra cobrança.');
    }
    const {data:claimed,error:claimError}=await context.supabase.rpc('claim_barber_checkout',{bid:data.barberId});
    if(claimError||!claimed) throw new Error(claimError?.message||'Não foi possível preparar o pagamento.');
    const {data:attempt,error:attemptError}=await context.supabase.rpc('claim_subscription_payment_order',{sid:sub.id,method:data.paymentMethod});
    if(attemptError||!attempt) throw new Error(attemptError?.message||'Não foi possível preparar a cobrança.');
    const claim=attempt as any;
    let remote=claim.provider_order_id?await mercadoOrders(`/v1/orders/${encodeURIComponent(claim.provider_order_id)}`):null;
    if(!remote) {
      const {data:tenant}=await db.from('tenants').select('name').eq('id',membership.tenant_id).single();
      const {data:account}=await context.supabase.auth.getUser();
      if(!account.user?.email) throw new Error('Sua conta precisa ter um e-mail confirmado para gerar a cobrança.');
      const {data:barber}=await db.from('barbershop_records').select('data').eq('tenant_id',membership.tenant_id).eq('kind','barbers').eq('id',data.barberId).single();
      const payer=data.payer;
      if(!payer) throw new Error('Preencha seus dados para gerar a cobrança.');
      const address=data.paymentMethod==='boleto'?payer:null;
      if(data.paymentMethod==='boleto'&&(!address?.zipCode||!address.street||!address.number||!address.neighborhood||!address.city||!address.state)) throw new Error('Preencha o endereço completo para emitir o boleto.');
      const money=(claim.amount_cents/100).toFixed(2);
      const paymentMethod=data.paymentMethod==='pix'?{id:'pix',type:'bank_transfer'}:{id:'boleto',type:'ticket'};
      const body:any={
        // Only fields documented for POST /v1/orders. `capture_mode` is not part of the request and made Pix orders fail with property_value.
        type:'online',external_reference:String(claim.id),processing_mode:'automatic',
        total_amount:money,description:safeDescription(`Mensalidade MenuBarber - ${tenant?.name||'Barbearia'} - ${String(barber?.data?.name||'Barbeiro')}`),
        payer:{email:account.user.email.trim().toLowerCase(),first_name:payer.firstName,last_name:payer.lastName,identification:{type:'CPF',number:payer.cpf},...(address?{address:{zip_code:address.zipCode,street_name:address.street,street_number:address.number,neighborhood:address.neighborhood,city:address.city,state:address.state}}:{})},
        transactions:{payments:[{amount:money,payment_method:paymentMethod,...(data.paymentMethod==='pix'?{expiration_time:'PT24H'}:{expiration_time:'P3D'})}]},
      };
      if(address) body.config={location:{state_id:`BR-${address.state}`}};
      try {
        remote=await mercadoOrders('/v1/orders','POST',body,String(claim.id));
      } catch (error) {
        const diagnostic=error as Error&{providerStatus?:number;providerCode?:string|null;providerFields?:string[];requestId?:string|null};
        // A definitive HTTP rejection must not leave this attempt in `creating`;
        // otherwise claim_subscription_payment_order would reuse its idempotency key forever.
        // Keep transport/timeout failures untouched because Mercado Pago may have received them.
        if (diagnostic.providerStatus) {
          await db.from('subscription_payment_orders').update({
            state:'rejected',
            payment_data:{error:{httpStatus:diagnostic.providerStatus,code:diagnostic.providerCode||null,fields:diagnostic.providerFields||[],requestId:diagnostic.requestId||null}},
            updated_at:new Date().toISOString(),
          }).eq('id',claim.id).is('provider_order_id',null);
        }
        throw error;
      }
    }
    if(!remote?.id||String(remote.external_reference)!==String(claim.id)||Math.round(Number(remote.total_amount)*100)!==claim.amount_cents) throw new Error('O Mercado Pago não confirmou a cobrança. Consulte o pagamento antes de tentar novamente.');
    const payment=remote.transactions?.payments?.[0]||{};
    const details=payment.payment_method||{};
    // Keep boleto attempts locked beyond weekends, since Mercado Pago adjusts their
    // effective due date to the next business day.
    const expiry=data.paymentMethod==='pix'?new Date(Date.now()+24*60*60*1000).toISOString():new Date(Date.now()+5*24*60*60*1000).toISOString();
    const {error:saveError}=await db.from('subscription_payment_orders').update({provider_order_id:String(remote.id),provider_payment_id:payment.id?String(payment.id):null,state:remote.status==='action_required'?'pending':remote.status==='processed'?'approved':'review',payment_data:{id:payment.id?String(payment.id):null,status:payment.status||null,statusDetail:payment.status_detail||null,methodId:details.id||null,ticketUrl:details.ticket_url||null,qrCode:details.qr_code||null,qrCodeBase64:details.qr_code_base64||null,barcodeContent:details.barcode_content||null,digitableLine:details.digitable_line||null},expires_at:expiry,updated_at:new Date().toISOString()}).eq('id',claim.id);
    if(saveError) throw new Error('Cobrança criada, mas ainda precisa ser conciliada. Use “Consultar pagamento” antes de gerar outra.');
    await db.from('barber_subscriptions').update({state:'pending'}).eq('id',sub.id).is('provider_id',null);
    return {transparent:true,orderId:String(remote.id),method:data.paymentMethod,amountCents:claim.amount_cents,payment:{id:payment.id?String(payment.id):null,status:payment.status||null,ticketUrl:details.ticket_url||null,qrCode:details.qr_code||null,qrCodeBase64:details.qr_code_base64||null,barcodeContent:details.barcode_content||null,digitableLine:details.digitable_line||null},expiresAt:expiry};
  }
  throw new Error('Ação de cobrança inválida.');
 });

export const platformBillingStatus = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const {data:allowed}=await context.supabase.rpc('is_platform_admin');
  if(!allowed) throw new Error('Acesso restrito ao superadministrador.');
  const {billingReady}=await import('@/lib/mercadopago.server');
  const {data:config,error}=await (context.supabase as any).rpc('platform_mercado_pago_config_status');
  if(error) throw new Error('Não foi possível consultar as configurações seguras do Mercado Pago.');
  return {ready:await billingReady(),config,webhookPath:'/api/mercadopago/webhook'};
});

export const validatePlatformMercadoConfig = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  const {data:allowed}=await context.supabase.rpc('is_platform_admin');
  if(!allowed) throw new Error('Acesso restrito ao superadministrador.');
  const {validateMercadoPagoMethods}=await import('@/lib/mercadopago.server');
  return validateMercadoPagoMethods();
});

const platformConfigInput=z.object({accessToken:z.string().max(512).optional().default(''),webhookSecret:z.string().max(512).optional().default(''),publicKey:z.string().max(256).optional().default(''),appUrl:z.string().max(255).optional().default('')});
export const savePlatformMercadoConfig=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(platformConfigInput).handler(async({data,context})=>{
  const {data:allowed}=await context.supabase.rpc('is_platform_admin');
  if(!allowed) throw new Error('Acesso restrito ao superadministrador.');
  const {data:status,error}=await (context.supabase as any).rpc('platform_save_mercado_pago_config',{p_access_token:data.accessToken,p_webhook_secret:data.webhookSecret,p_public_key:data.publicKey,p_app_url:data.appUrl});
  if(error) throw new Error(error.message||'Não foi possível salvar as credenciais.');
  return {config:status};
});
