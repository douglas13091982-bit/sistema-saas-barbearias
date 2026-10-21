import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyMercadoSignature(secret: string, signature: string, requestId: string, resourceId: string): boolean {
  const values = Object.fromEntries(signature.split(',').map(item => item.trim().split('=')));
  if (!secret || !requestId || !resourceId || !/^\d+$/.test(values.ts || '') || !/^[a-f0-9]{64}$/i.test(values.v1 || '')) return false;
  const manifest = `id:${resourceId.toLowerCase()};request-id:${requestId};ts:${values.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(values.v1, 'hex'));
}

export function billingReady() {
  return Boolean(process.env['MERCADO_PAGO_ACCESS_TOKEN'] && process.env['MERCADO_PAGO_WEBHOOK_SECRET'] && process.env['APP_URL']);
}

export async function mercado(path: string, method = 'GET', body?: unknown, idempotencyKey?: string): Promise<any> {
  const token = process.env['MERCADO_PAGO_ACCESS_TOKEN'];
  if (!token) throw new Error('A integração Mercado Pago ainda não foi configurada pela plataforma.');
  const result = await fetch(`https://api.mercadopago.com${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  if (!result.ok) throw new Error('O Mercado Pago não confirmou esta operação. Tente consultar o pagamento novamente.');
  return result.json();
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
