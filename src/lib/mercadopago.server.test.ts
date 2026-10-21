// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingReady, mercadoPublicKey, reconcileSubscription, reconcileAuthorizedPayment, verifyMercadoSignature } from './mercadopago.server';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Mercado Pago billing protections',()=>{
 it('requires server credentials, webhook secret, URL, and public key before checkout is ready',()=>{
  vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN','access');vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET','webhook');vi.stubEnv('APP_URL','https://example.test');vi.stubEnv('MERCADO_PAGO_PUBLIC_KEY','public');
  expect(billingReady()).toBe(true);expect(mercadoPublicKey()).toBe('public');
  vi.stubEnv('MERCADO_PAGO_PUBLIC_KEY','');expect(billingReady()).toBe(false);expect(mercadoPublicKey()).toBe('');
 });
 it('validates the signature against the exact resource and request',()=>{
  const signature='ts=1704908010,v1='+createHmac('sha256','secret').update('id:invoice1;request-id:req1;ts:1704908010;').digest('hex');
  expect(verifyMercadoSignature('secret',signature,'req1','invoice1')).toBe(true);
  expect(verifyMercadoSignature('secret',signature,'req1','invoice2')).toBe(false);
  expect(verifyMercadoSignature('secret',signature,'req2','invoice1')).toBe(false);
  expect(verifyMercadoSignature('secret','ts=1,v1=bad','req1','invoice1')).toBe(false);
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
});
