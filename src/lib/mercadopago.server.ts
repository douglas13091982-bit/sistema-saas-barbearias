import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyMercadoSignature(secret: string, signature: string, requestId: string, resourceId: string): boolean {
  const values = Object.fromEntries(signature.split(',').map(item => item.trim().split('=')));
  if (!secret || !requestId || !resourceId || !/^\d+$/.test(values.ts || '') || !/^[a-f0-9]{64}$/i.test(values.v1 || '')) return false;
  // Mercado Pago signs the exact data.id value from the request, including the case
  // of alphanumeric Orders API IDs (for example, ORD01...).
  const manifest = `id:${resourceId};request-id:${requestId};ts:${values.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(values.v1, 'hex'));
}

export type MercadoPagoConfig = { accessToken: string; webhookSecret: string; publicKey: string; appUrl: string; ordersAccessToken:string; ordersWebhookSecret:string };
export async function getMercadoConfig(): Promise<MercadoPagoConfig> {
  const env={accessToken:process.env['MERCADO_PAGO_ACCESS_TOKEN']||'',webhookSecret:process.env['MERCADO_PAGO_WEBHOOK_SECRET']||'',publicKey:process.env['MERCADO_PAGO_PUBLIC_KEY']||'',appUrl:process.env['APP_URL']||'',ordersAccessToken:process.env['MERCADO_PAGO_ORDERS_ACCESS_TOKEN']||'',ordersWebhookSecret:process.env['MERCADO_PAGO_ORDERS_WEBHOOK_SECRET']||''};
  try {
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    const {data,error}=await (supabaseAdmin as any).rpc('platform_mercado_pago_config_private');
    if(!error&&data) return {accessToken:data.accessToken||env.accessToken,webhookSecret:data.webhookSecret||env.webhookSecret,publicKey:data.publicKey||env.publicKey,appUrl:data.appUrl||env.appUrl,ordersAccessToken:data.ordersAccessToken||env.ordersAccessToken,ordersWebhookSecret:data.ordersWebhookSecret||env.ordersWebhookSecret};
  } catch { /* Allow server environment credentials as a migration fallback. */ }
  return env;
}

export async function billingReady() {
  const config=await getMercadoConfig();
  return Boolean(config.accessToken&&config.webhookSecret&&config.publicKey&&config.appUrl&&config.ordersAccessToken&&config.ordersWebhookSecret);
}

async function mercadoRequest(token:string,path:string,method='GET',body?:unknown,idempotencyKey?:string):Promise<any>{
  if (!token) throw new Error('A integração Mercado Pago ainda não foi configurada pela plataforma.');
  const result = await fetch(`https://api.mercadopago.com${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  if (!result.ok) {
    const details:any=await result.json().catch(()=>({}));
    // Keep provider diagnostics on the server; never return raw API details or credentials to the browser.
    console.error('[mercadopago] request failed', {path,method,status:result.status,code:details.error||details.cause?.[0]?.code,message:details.message,requestId:result.headers.get('x-request-id')});
    throw new Error('O Mercado Pago recusou a operação. Confira o meio de pagamento e tente novamente; se persistir, consulte o suporte com o horário da tentativa.');
  }
  return result.json();
}

export async function mercado(path: string, method = 'GET', body?: unknown, idempotencyKey?: string): Promise<any> {
  const {accessToken}=await getMercadoConfig();
  return mercadoRequest(accessToken,path,method,body,idempotencyKey);
}

export async function mercadoOrders(path: string, method = 'GET', body?: unknown, idempotencyKey?: string): Promise<any> {
  const {ordersAccessToken}=await getMercadoConfig();
  return mercadoRequest(ordersAccessToken,path,method,body,idempotencyKey);
}

export async function validateMercadoPagoMethods() {
  const methods=await mercadoOrders('/v1/payment_methods');
  if(!Array.isArray(methods)) throw new Error('O Mercado Pago retornou uma lista de meios de pagamento inválida.');
  // Search only for an intentionally nonexistent marker to confirm that the
  // separate Subscriptions application can reach the API without creating a charge.
  const subscriptions=await mercado('/preapproval/search?external_reference=menubarber-connection-check&limit=1');
  if(!subscriptions||!Array.isArray(subscriptions.results)) throw new Error('A aplicação de Assinaturas não retornou uma resposta válida.');
  const types=new Set(methods.map((item:any)=>`${item.id||''}:${item.payment_type_id||''}`));
  return {
    authenticated:true,
    subscriptionsApi:true,
    pix:[...types].some(value=>value.startsWith('pix:')||value.endsWith(':bank_transfer')),
    boleto:[...types].some(value=>value.startsWith('boleto:')||value.startsWith('bolbradesco:')||value.endsWith(':ticket')),
    card:[...types].some(value=>value.endsWith(':credit_card')),
  };
}

function orderPayment(order:any) { return order?.transactions?.payments?.[0] || null; }
function orderPaymentData(payment:any) {
  const method=payment?.payment_method || {};
  return {
    id:payment?.id ? String(payment.id) : null,
    status:payment?.status || null,
    statusDetail:payment?.status_detail || null,
    methodId:method.id || null,
    ticketUrl:method.ticket_url || null,
    qrCode:method.qr_code || null,
    qrCodeBase64:method.qr_code_base64 || null,
    barcodeContent:method.barcode_content || null,
    digitableLine:method.digitable_line || null,
  };
}

export async function reconcileTransparentOrder(db:any,id:string) {
  const {data:attempt,error}=await db.from('subscription_payment_orders').select('*').eq('provider_order_id',id).maybeSingle();
  if(error) throw new Error('Falha ao localizar a cobrança transparente.');
  if(!attempt) return null;
  const order=await mercadoOrders(`/v1/orders/${encodeURIComponent(id)}`);
  if(String(order.id)!==id || String(order.external_reference)!==attempt.id || Math.round(Number(order.total_amount)*100)!==attempt.amount_cents || (order.currency && order.currency!=='BRL') || (order.currency_id && order.currency_id!=='BRL')) throw new Error('Order incompatível com a cobrança local.');
  const payment=orderPayment(order),paymentData=orderPaymentData(payment);
  const expectedMethod=attempt.payment_method==='pix'?'pix':'boleto';
  if(paymentData.methodId && paymentData.methodId!==expectedMethod) throw new Error('Meio de pagamento incompatível com a cobrança local.');
  const collected=Number(payment?.paid_amount??order.total_paid_amount??0);
  const successful=order.status==='processed' && payment?.status==='processed' && collected>=attempt.amount_cents/100;
  const reversed=['refunded','charged_back','cancelled'].includes(order.status) || ['refunded','charged_back','cancelled'].includes(payment?.status);
  const pending=order.status==='action_required' || payment?.status==='action_required' || order.status==='pending';
  const state=successful?'approved':reversed?(order.status==='cancelled'?'cancelled':'rejected'):pending?'pending':order.status==='expired'?'expired':order.status==='failed'?'rejected':'review';
  const paidAt=successful?(attempt.approved_at||new Date().toISOString()):attempt.approved_at;
  const {error:updateError}=await db.from('subscription_payment_orders').update({
    provider_payment_id:paymentData.id,state,payment_data:paymentData,approved_at:paidAt,
    updated_at:new Date().toISOString(),
  }).eq('id',attempt.id);
  if(updateError) throw new Error('Não foi possível salvar o status da cobrança.');
  if(paymentData.id && paidAt && (successful||reversed)) {
    const {error:applyError}=await db.rpc('apply_subscription_payment',{
      sid:attempt.subscription_id,pid:paymentData.id,is_approved:successful,
      cents:attempt.amount_cents,approved_at:paidAt,
    });
    if(applyError) throw new Error('Não foi possível conciliar o pagamento aprovado.');
  }
  return {order,attempt:{...attempt,state,approved_at:paidAt},payment:paymentData};
}

export async function reconcileSubscription(db: any, subscription: any) {
  if (!subscription.provider_id) return;
  const remote = await mercado(`/preapproval/${encodeURIComponent(subscription.provider_id)}`);
  if (String(remote.external_reference) !== subscription.id || remote.auto_recurring?.currency_id !== 'BRL' || Math.round(Number(remote.auto_recurring?.transaction_amount) * 100) !== subscription.amount_cents) throw new Error('Assinatura incompatível.');
  const state = ['pending', 'authorized', 'paused', 'cancelled'].includes(remote.status) ? remote.status : 'review';
  const { error } = await db.from('barber_subscriptions').update({ state }).eq('id', subscription.id).eq('provider_id', subscription.provider_id);
  if (error) throw new Error('Não foi possível atualizar a assinatura.');
  // Authorization alone never grants booking access. Only approved payments do.
  return remote;
}

export async function reconcileAuthorizedPayment(db: any, id: string) {
  const invoice = await mercado(`/authorized_payments/${encodeURIComponent(id)}`);
  const { data: sub, error } = await db.from('barber_subscriptions').select('*').eq('provider_id', String(invoice.preapproval_id)).maybeSingle();
  if (error) throw new Error('Falha ao consultar assinatura.');
  if (!sub || !invoice.payment?.id) return;
  await reconcileSubscription(db, sub);
  const payment = await mercado(`/v1/payments/${encodeURIComponent(String(invoice.payment.id))}`);
  const amount = Math.round(Number(payment.transaction_amount) * 100);
  if (payment.currency_id !== 'BRL' || amount !== sub.amount_cents || !payment.date_approved) return;
  if (!['approved', 'refunded', 'charged_back', 'cancelled'].includes(payment.status)) return;
  const { error: applyError } = await db.rpc('apply_subscription_payment', {
    sid: sub.id, pid: String(payment.id), is_approved: payment.status === 'approved' && Number(payment.transaction_amount_refunded || 0) === 0,
    cents: amount, approved_at: payment.date_approved,
  });
  if (applyError) throw new Error('Não foi possível conciliar o pagamento.');
}

export async function reconcilePaymentChange(db: any, id: string) {
  // Refund and chargeback events contain a payment ID, not an invoice ID.
  const { data: known } = await db.from('subscription_payments').select('subscription_id').eq('provider_payment_id', id).maybeSingle();
  if (!known) return;
  const { data: sub } = await db.from('barber_subscriptions').select('*').eq('id', known.subscription_id).single();
  const payment = await mercado(`/v1/payments/${encodeURIComponent(id)}`);
  if (!sub || payment.currency_id !== 'BRL' || !payment.date_approved || !['approved','refunded','charged_back','cancelled'].includes(payment.status)) return;
  const { error } = await db.rpc('apply_subscription_payment', { sid: sub.id, pid: id, cents: Math.round(Number(payment.transaction_amount)*100), approved_at: payment.date_approved, is_approved: payment.status==='approved' && Number(payment.transaction_amount_refunded || 0)===0 });
  if(error) throw new Error('Não foi possível atualizar o pagamento.');
}
