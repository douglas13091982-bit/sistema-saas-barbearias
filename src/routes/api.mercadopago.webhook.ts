import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/mercadopago/webhook')({
 server:{handlers:{POST:async({request})=>{
  const {verifyMercadoSignature,reconcileSubscription,reconcileAuthorizedPayment,reconcilePaymentChange,reconcileTransparentOrder,getMercadoConfig}=await import('@/lib/mercadopago.server');
  const body=await request.json().catch(()=>null);
  if(!body||typeof body!=='object') return new Response('Notificação inválida',{status:400});
  const config=await getMercadoConfig();
  const secret=body.type==='order'?config.ordersWebhookSecret:config.webhookSecret;
  if(!secret) return new Response('Integração indisponível',{status:503});
  const url=new URL(request.url),id=url.searchParams.get('data.id') || '';
  if(!/^[a-zA-Z0-9-]{1,100}$/.test(id) || !verifyMercadoSignature(secret,request.headers.get('x-signature') || '',request.headers.get('x-request-id') || '',id)) return new Response('Assinatura inválida',{status:401});
  try {
   if(String(body.data?.id)!==id) return new Response('Recurso inválido',{status:400});
   const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
   const db:any=supabaseAdmin;
   if(body.type==='order') await reconcileTransparentOrder(db,id);
   else if(body.type==='subscription_authorized_payment') await reconcileAuthorizedPayment(db,id);
   else if(body.type==='payment') await reconcilePaymentChange(db,id);
   else if(body.type==='subscription_preapproval') {
    const {data:sub}=await db.from('barber_subscriptions').select('*').eq('provider_id',id).maybeSingle();
    if(sub) await reconcileSubscription(db,sub);
   }
   return new Response('OK',{status:200});
  } catch { return new Response('Não foi possível conciliar',{status:503}); }
 }}}
});
