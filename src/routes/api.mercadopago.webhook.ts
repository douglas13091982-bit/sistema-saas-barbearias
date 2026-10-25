import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/mercadopago/webhook')({
 server:{handlers:{POST:async({request})=>{
  const {verifyMercadoSignature,reconcileSubscription,reconcileAuthorizedPayment,reconcilePaymentChange,reconcileTransparentOrder,getMercadoConfig}=await import('@/lib/mercadopago.server');
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=='object') return new Response('Notificação inválida',{status:400});
  const url=new URL(request.url);
  // Orders notifications announce their topic in the query string (type=order) and in the body.
  const type=String(url.searchParams.get('type')||body.type||'');
  const config=await getMercadoConfig();
  const secret=type==='order'?config.ordersWebhookSecret:config.webhookSecret;
  if(!secret) return new Response('Integração indisponível',{status:503});
  const id=url.searchParams.get('data.id')||String(body.data?.id||'');
  const signature=request.headers.get('x-signature')||'',requestId=request.headers.get('x-request-id')||'';
  // Mercado Pago may sign alphanumeric IDs (Orders API) either as sent or lowercased; both still require a valid HMAC.
  const signed=/^[a-zA-Z0-9-]{1,100}$/.test(id)&&(verifyMercadoSignature(secret,signature,requestId,id)||verifyMercadoSignature(secret,signature,requestId,id.toLowerCase()));
  if(!signed) return new Response('Assinatura inválida',{status:401});
  try {
   if(String(body.data?.id).toLowerCase()!==id.toLowerCase()) return new Response('Recurso inválido',{status:400});
   const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
   const db:any=supabaseAdmin;
   if(type==='order') await reconcileTransparentOrder(db,id);
   else if(type==='subscription_authorized_payment') await reconcileAuthorizedPayment(db,id);
   else if(type==='payment') await reconcilePaymentChange(db,id);
   else if(type==='subscription_preapproval') {
    const {data:sub}=await db.from('barber_subscriptions').select('*').eq('provider_id',id).maybeSingle();
    if(sub) await reconcileSubscription(db,sub);
   }
   return new Response('OK',{status:200});
  } catch (error) { console.error('[mercadopago] webhook reconciliation failed',{type,id,error:error instanceof Error?error.message:String(error)}); return new Response('Não foi possível conciliar',{status:503}); }
 }}}
});
