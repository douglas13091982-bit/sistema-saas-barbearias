// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidCpf, safeDescription, formatCpf } from './cpf';
import { billingReady, getMercadoConfig, reconcileSubscription, reconcileAuthorizedPayment, reconcileTransparentOrder, validateMercadoPagoMethods, verifyMercadoSignature } from './mercadopago.server';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Mercado Pago billing protections',()=>{
 it('requires server credentials, webhook secret, URL, and public key before checkout is ready',async()=>{
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','access');vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET','webhook');vi.stubEnv('APP_URL','https://example.test');vi.stubEnv('MERCADO_PAGO_PUBLIC_KEY','public');vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','orders-access');vi.stubEnv('MERCADO_PAGO_ORDERS_WEBHOOK_SECRET','orders-webhook');
  expect(await billingReady()).toBe(true);expect((await getMercadoConfig()).publicKey).toBe('public');
  vi.stubEnv('MERCADO_PAGO_PUBLIC_KEY','');expect(await billingReady()).toBe(false);expect((await getMercadoConfig()).publicKey).toBe('');
 });
 it('validates the signature against the exact resource and request',()=>{
  const signature='ts=1704908010,v1='+createHmac('sha256','secret').update('id:invoice1;request-id:req1;ts:1704908010;').digest('hex');
  expect(verifyMercadoSignature('secret',signature,'req1','invoice1')).toBe(true);
  expect(verifyMercadoSignature('secret',signature,'req1','invoice2')).toBe(false);
  expect(verifyMercadoSignature('secret',signature,'req2','invoice1')).toBe(false);
  expect(verifyMercadoSignature('secret','ts=1,v1=bad','req1','invoice1')).toBe(false);
 });
 it('preserves the case of alphanumeric Orders API IDs in the webhook signature',()=>{
  const id='ORD01ABCDEF',ts='1782240000',requestId='order-req';
  const signature=`ts=${ts},v1=${createHmac('sha256','secret').update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex')}`;
  expect(verifyMercadoSignature('secret',signature,requestId,id)).toBe(true);
  expect(verifyMercadoSignature('secret',signature,requestId,id.toLowerCase())).toBe(false);
 });
 it('never grants booking access merely because a subscription is authorized',async()=>{
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({external_reference:'sub1',status:'authorized',auto_recurring:{currency_id:'BRL',transaction_amount:20}})}));
  const chain={eq:vi.fn().mockReturnThis(),then:(resolve:any)=>resolve({error:null})};
  const update=vi.fn().mockReturnValue(chain), rpc=vi.fn();
  await reconcileSubscription({from:()=>({update}),rpc},{id:'sub1',provider_id:'mp1',amount_cents:2000});
  expect(update).toHaveBeenCalledWith({state:'authorized'}); expect(rpc).not.toHaveBeenCalled();
 });
 it('rejects a subscription with a different price before changing entitlement',async()=>{
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({external_reference:'sub1',auto_recurring:{currency_id:'BRL',transaction_amount:1}})}));
  const from=vi.fn();
  await expect(reconcileSubscription({from},{id:'sub1',provider_id:'mp1',amount_cents:2000})).rejects.toThrow('Assinatura incompatível');
  expect(from).not.toHaveBeenCalled();
 });
 it('does not unlock a pending payment',async()=>{
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','test');
  const responses=[{preapproval_id:'mp1',payment:{id:123}},{external_reference:'sub1',status:'authorized',auto_recurring:{currency_id:'BRL',transaction_amount:20}},{id:123,currency_id:'BRL',transaction_amount:20,status:'pending'}];
  vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>({ok:true,json:async()=>responses.shift()})));
  const chain:any={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),maybeSingle:async()=>({data:{id:'sub1',provider_id:'mp1',amount_cents:2000}}),then:(resolve:any)=>resolve({error:null})};
  const rpc=vi.fn();await reconcileAuthorizedPayment({from:()=>chain,rpc},'inv1');expect(rpc).not.toHaveBeenCalled();
 });
 it('reconciles an approved transparent order against its amount and local reference',async()=>{
  vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'ORD01ABC',external_reference:'attempt1',total_amount:'20.00',total_paid_amount:'20.00',status:'processed',transactions:{payments:[{id:'PAY01ABC',amount:'20.00',paid_amount:'20.00',status:'processed',payment_method:{id:'pix',type:'bank_transfer',qr_code:'copy-paste'}}]}})}));
  const attempt={id:'attempt1',subscription_id:'sub1',provider_order_id:'ORD01ABC',payment_method:'pix',amount_cents:2000,approved_at:null};
  const chain:any={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),ilike:vi.fn().mockReturnThis(),maybeSingle:async()=>({data:attempt,error:null}),update:vi.fn().mockReturnThis(),then:(resolve:any)=>resolve({error:null})};
  const rpc=vi.fn().mockResolvedValue({error:null});
  const result=await reconcileTransparentOrder({from:()=>chain,rpc},'ORD01ABC');
  expect(result?.attempt.state).toBe('approved');
  expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({state:'approved',provider_payment_id:'PAY01ABC'}));
  expect(rpc).toHaveBeenCalledWith('apply_subscription_payment',expect.objectContaining({sid:'sub1',pid:'PAY01ABC',is_approved:true,cents:2000}));
 });
 it('never approves an order with an unpaid or partial Pix transaction',async()=>{
  vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'ORD01ABC',external_reference:'attempt1',total_amount:'20.00',total_paid_amount:'0.00',status:'action_required',transactions:{payments:[{id:'PAY01ABC',amount:'20.00',paid_amount:'0.00',status:'action_required',payment_method:{id:'pix',type:'bank_transfer'}}]}})}));
  const chain:any={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),ilike:vi.fn().mockReturnThis(),maybeSingle:async()=>({data:{id:'attempt1',subscription_id:'sub1',provider_order_id:'ORD01ABC',payment_method:'pix',amount_cents:2000,approved_at:null},error:null}),update:vi.fn().mockReturnThis(),then:(resolve:any)=>resolve({error:null})};
  const rpc=vi.fn();
  const result=await reconcileTransparentOrder({from:()=>chain,rpc},'ORD01ABC');
  expect(result?.attempt.state).toBe('pending');expect(rpc).not.toHaveBeenCalled();
 });
 it('checks that the configured account exposes the requested payment methods without charging',async()=>{
  vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','test');
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','subscriptions-test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>[{id:'pix',payment_type_id:'bank_transfer'},{id:'boleto',payment_type_id:'ticket'},{id:'visa',payment_type_id:'credit_card'}]}).mockResolvedValueOnce({ok:true,json:async()=>({results:[]})}));
  await expect(validateMercadoPagoMethods()).resolves.toEqual({authenticated:true,subscriptionsApi:true,pix:true,boleto:true,card:true});
 });

 it('finds the local order even when the notification carries the ID in another letter case',async()=>{
  vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','test');
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:'ORD01ABC',external_reference:'attempt1',total_amount:'20.00',total_paid_amount:'0.00',status:'action_required',transactions:{payments:[{id:'PAY01ABC',amount:'20.00',paid_amount:'0.00',status:'action_required',payment_method:{id:'pix',type:'bank_transfer'}}]}})});
  vi.stubGlobal('fetch',fetchMock);
  const chain:any={select:vi.fn().mockReturnThis(),ilike:vi.fn().mockReturnThis(),maybeSingle:async()=>({data:{id:'attempt1',subscription_id:'sub1',provider_order_id:'ORD01ABC',payment_method:'pix',amount_cents:2000,approved_at:null},error:null}),update:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),then:(resolve:any)=>resolve({error:null})};
  const result=await reconcileTransparentOrder({from:()=>chain,rpc:vi.fn()},'ord01abc');
  expect(chain.ilike).toHaveBeenCalledWith('provider_order_id','ord01abc');
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/v1/orders/ORD01ABC');
  expect(result?.attempt.state).toBe('pending');
 });
 it('reports which field Mercado Pago rejected without leaking the raw response',async()=>{
  vi.stubEnv('MERCADO_PAGO_ORDERS_ACCESS_TOKEN','test');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:400,headers:{get:()=>'req-123'},json:async()=>({errors:[{code:'property_value',message:'secret internal text',details:['payer.email']}]})}));
  const {mercadoOrders}=await import('./mercadopago.server');
  const error:any=await mercadoOrders('/v1/orders','POST',{a:1},'key').catch(e=>e);
  expect(error.message).toContain('Campo(s): payer.email');
  expect(error.message).toContain('property_value');
  expect(error.message).not.toContain('secret internal text');
  expect(error.providerFields).toEqual(['payer.email']);
 });
 it('validates CPF check digits and builds a safe order description',()=>{
  expect(isValidCpf('529.982.247-25')).toBe(true);
  expect(isValidCpf('52998224726')).toBe(false);
  expect(isValidCpf('111.111.111-11')).toBe(false);
  expect(formatCpf('52998224725')).toBe('529.982.247-25');
  expect(safeDescription('Mensalidade — Barbearia José & Filhos')).toBe('Mensalidade Barbearia Jose Filhos');
 });
});
