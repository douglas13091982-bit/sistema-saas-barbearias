import { useCallback, useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { billingAction } from '@/lib/billing.functions';
import '@/styles/saas.css';

declare global {
  interface Window { MercadoPago?: new (key: string, options?: { locale: string }) => { cardForm: (options: Record<string, unknown>) => { getCardFormData: () => { token?: string }; destroy?: () => void } } }
}

let mercadoScript: Promise<void> | undefined;
function loadMercadoPago() {
  if (window.MercadoPago) return Promise.resolve();
  if (!mercadoScript) mercadoScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mercado-pago-sdk]');
    const script = existing || document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2'; script.async = true; script.dataset['mercadoPagoSdk'] = 'true';
    script.onload = () => resolve(); script.onerror = () => { mercadoScript = undefined; reject(new Error('Não foi possível carregar o formulário seguro do Mercado Pago.')); };
    if (!existing) document.head.appendChild(script);
  });
  return mercadoScript;
}

type Prepared = { barberId: string; barberName: string; amountCents: number; payerEmail: string; trialEndsAt: string | null; publicKey: string };
export default function Billing(){
 const {tenant,barbers,bookingAccess,refresh,currentUser}=useData();
 const action=useServerFn(billingAction);
 const [subscriptions,setSubscriptions]=useState<any[]>([]),[price,setPrice]=useState<number|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[prepared,setPrepared]=useState<Prepared|null>(null);
 const load=useCallback(async()=>{
  const [rows,settings,status]=await Promise.all([supabase.from('barber_subscriptions').select('*').eq('tenant_id',tenant.id),supabase.from('saas_settings').select('price_per_barber_cents').eq('id',true).single(),action({data:{action:'status'}})]);
  if(rows.error||settings.error)throw new Error('Não foi possível carregar as mensalidades.');
  setSubscriptions(rows.data||[]);setPrice(settings.data?.price_per_barber_cents??null);setReady(!!status.ready&&!!status.publicKey);
 },[tenant?.id,action]);
 useEffect(()=>{if(currentUser?.role==='admin')void load().catch(e=>setError(e.message));},[load,currentUser?.role]);
 useEffect(()=>{
  if(!prepared)return;
  const previousOverflow=document.body.style.overflow;
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setPrepared(null);}};
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',closeOnEscape);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',closeOnEscape);};
 },[prepared]);
 const run=async(type:'prepare'|'checkout'|'sync'|'cancel',id:string)=>{
  if(busy)return;if(type==='cancel'&&!confirm('Cancelar as próximas cobranças deste barbeiro? A agenda permanece liberada apenas até o fim do período já pago.'))return;
  setBusy(id);setError('');setNotice('');
  try{
   const result:any=await action({data:{action:type,barberId:id}});
   if(result.url){window.location.assign(result.url);return;}
   if(result.legacyUrl){if(result.legacyUrl){window.location.assign(result.legacyUrl);return;}throw new Error('O checkout antigo precisa ser conciliado pelo superadministrador.');}
   if(type==='prepare'&&result.prepared){const barber=barbers.find((b:any)=>b.id===id);setPrepared({barberId:id,barberName:result.barberName||barber?.name||'Barbeiro',amountCents:result.amountCents,payerEmail:result.payerEmail,trialEndsAt:result.trialEndsAt,publicKey:result.publicKey});return;}
   if(result.authorized)setNotice('Assinatura autorizada pelo Mercado Pago. A agenda só será liberada após a confirmação de um pagamento aprovado.');
   else if(result.pending)setNotice('A assinatura foi criada e aguarda confirmação do Mercado Pago. A agenda continua sujeita à validação automática.');
   else if(type==='sync')setNotice('Consulta concluída. O estado da agenda depende da confirmação do pagamento.');
   setPrepared(null);await refresh();await load();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}
  finally{setBusy('');}
 };
 const submitToken=async(cardToken:string)=>{
  if(!prepared||busy)return;const barberId=prepared.barberId;setBusy(barberId);setError('');setNotice('');
  try{const result:any=await action({data:{action:'subscribe',barberId,cardToken}});if(result.legacyUrl){if(result.legacyUrl){window.location.assign(result.legacyUrl);return;}throw new Error('Este checkout antigo precisa ser conciliado pela plataforma.');}if(result.authorized)setNotice('Assinatura autorizada pelo Mercado Pago. A agenda só será liberada após a confirmação de um pagamento aprovado.');else if(result.pending)setNotice('A assinatura foi criada e aguarda confirmação. A agenda será liberada somente após pagamento aprovado.');else setNotice('O Mercado Pago recebeu o pedido. Consulte o pagamento em instantes para confirmar.');setPrepared(null);await refresh();await load();}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir. Se o resultado ficou indefinido, use “Consultar pagamento” antes de tentar novamente.');}
  finally{setBusy('');}
 };
 if(currentUser?.role!=='admin')return <p>Acesso restrito ao proprietário.</p>;
 const trial=new Date(tenant.trial_ends_at)>new Date();
 const money=(c:number)=> (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 return <div className="saas-admin"><p className="saas-kicker">MENSALIDADE</p><h1>Suas agendas, sob controle.</h1><p>{barbers.length} barbeiro(s) cadastrado(s), incluindo inativos. {price!==null?'Valor atual para novas assinaturas: '+money(price)+' por barbeiro/mês.':'A plataforma ainda não definiu o valor.'}</p><p>{trial?'Teste grátis até '+new Date(tenant.trial_ends_at).toLocaleString('pt-BR')+'. Depois disso, cada agenda exige pagamento confirmado.':'O período de teste terminou. Regularize as mensalidades para liberar as agendas.'}</p>
 <p>Cada barbeiro tem sua própria assinatura mensal. Inativar o perfil não cancela a cobrança; use Cancelar assinatura antes de excluir o cadastro.</p>
 {!ready&&<p className="saas-notice">A integração aguarda a configuração das credenciais do Mercado Pago pela plataforma. Pagamentos indisponíveis.</p>}{error&&<p role="alert" className="saas-notice">{error}</p>}{notice&&<p role="status" className="saas-notice">{notice}</p>}
 <div className="saas-grid">{barbers.map((barber:any)=>{const sub=subscriptions.find(s=>s.barber_id===barber.id);return <article className="saas-card" key={barber.id}><h2>{barber.name}</h2><p>{bookingAccess[barber.id]?'Agenda liberada':'Agenda bloqueada'} · {barber.active?'Perfil ativo':'Perfil inativo'}</p><p>{sub?.amount_cents?money(sub.amount_cents):price?money(price):'Valor a definir'} / mês</p><p>{sub?.paid_until?'Pago até '+new Date(sub.paid_until).toLocaleDateString('pt-BR'):trial?'Em teste grátis':'Aguardando pagamento'}</p><div className="saas-actions">{!sub?.provider_id&&<button disabled={!ready||!!busy||!price||sub?.state==='cancelled'} onClick={()=>void run('prepare',barber.id)}>{busy===barber.id?'Aguarde...':sub?.state==='creating'?'Continuar configuração':'Contratar com cartão'}</button>}{sub?.provider_id&&sub.state!=='authorized'&&<button disabled={!!busy} onClick={()=>void run('checkout',barber.id)}>Continuar pagamento iniciado antes do checkout transparente</button>}{(sub?.provider_id||sub?.state==='creating'||sub?.state==='review')&&<button disabled={!!busy} onClick={()=>void run('sync',barber.id)}>Consultar pagamento</button>}{sub?.provider_id&&sub.state!=='cancelled'&&<button disabled={!!busy} onClick={()=>void run('cancel',barber.id)}>Cancelar assinatura</button>}</div>{sub?.state==='cancelled'&&<small>Assinatura cancelada. Entre em contato com a plataforma para reativar este cadastro.</small>}</article>;})}</div>
 {prepared&&<div className="saas-checkout-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setPrepared(null);}}><section className="saas-card saas-checkout" role="dialog" aria-modal="true" aria-labelledby="checkout-title" tabIndex={-1}><button className="saas-checkout-close" type="button" onClick={()=>setPrepared(null)} aria-label="Fechar checkout" autoFocus>×</button><p className="saas-kicker">PAGAMENTO SEGURO</p><h2 id="checkout-title">Mensalidade de {prepared.barberName}</h2><p><strong>{money(prepared.amountCents)} / mês</strong>{prepared.trialEndsAt&&new Date(prepared.trialEndsAt)>new Date()?' · primeira cobrança após o teste grátis de 7 dias':''}</p><p>Pagamento processado pelo Mercado Pago. Os dados do cartão são digitados nos campos seguros deles e não ficam salvos neste sistema.</p><CardCheckout key={prepared.barberId} prepared={prepared} disabled={!!busy} onSubmit={submitToken}/><button type="button" className="saas-checkout-cancel" disabled={!!busy} onClick={()=>setPrepared(null)}>Cancelar</button></section></div>}
 {barbers.length===0&&<p>Cadastre seu primeiro profissional em Barbeiros para começar.</p>}
 </div>;
}

function CardCheckout({prepared,disabled,onSubmit}:{prepared:Prepared;disabled:boolean;onSubmit:(token:string)=>void}){
 const instance=useRef<{getCardFormData:()=>{token?:string};destroy?:()=>void}|null>(null),submitRef=useRef(onSubmit),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{submitRef.current=onSubmit;},[onSubmit]);
 useEffect(()=>{
  let live=true;
  void loadMercadoPago().then(()=>{
   if(!live||!window.MercadoPago)return;
   const mp=new window.MercadoPago(prepared.publicKey,{locale:'pt-BR'});
   instance.current=mp.cardForm({amount:(prepared.amountCents/100).toFixed(2),iframe:true,form:{id:'form-checkout',cardholderName:{id:'form-checkout__cardholderName',placeholder:'Nome impresso no cartão'},cardholderEmail:{id:'form-checkout__cardholderEmail',placeholder:'E-mail'},cardNumber:{id:'form-checkout__cardNumber',placeholder:'Número do cartão'},expirationDate:{id:'form-checkout__expirationDate',placeholder:'MM/AA'},securityCode:{id:'form-checkout__securityCode',placeholder:'CVV'},identificationType:{id:'form-checkout__identificationType'},identificationNumber:{id:'form-checkout__identificationNumber',placeholder:'CPF'},issuer:{id:'form-checkout__issuer'},installments:{id:'form-checkout__installments'}},callbacks:{onFormMounted:(e?:Error)=>{if(e){setError('Não foi possível abrir os campos do cartão.');return;}setLoading(false);},onSubmit:(event:Event)=>{event.preventDefault();try{const token=instance.current?.getCardFormData().token;if(!token){setError('Confira os dados do cartão e tente novamente.');return;}submitRef.current(token);}catch{setError('Não foi possível tokenizar o cartão. Confira os dados e tente novamente.');}},onError:()=>setError('O Mercado Pago não conseguiu validar os dados. Confira o cartão e tente novamente.')}});
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:'Não foi possível carregar o checkout seguro.');});
  return()=>{live=false;instance.current?.destroy?.();instance.current=null;};
 },[prepared.amountCents,prepared.barberId,prepared.publicKey]);
 return <form id="form-checkout" className="saas-card-form"><div className="saas-card-fields"><label>Número do cartão<div id="form-checkout__cardNumber" className="saas-mp-field"/></label><label>Validade<div id="form-checkout__expirationDate" className="saas-mp-field"/></label><label>CVV<div id="form-checkout__securityCode" className="saas-mp-field"/></label><label>Nome no cartão<input id="form-checkout__cardholderName" autoComplete="cc-name" required/></label><label>E-mail<input id="form-checkout__cardholderEmail" type="email" defaultValue={prepared.payerEmail} autoComplete="email" required/></label><label>CPF<select id="form-checkout__identificationType"/></label><label>Número do documento<input id="form-checkout__identificationNumber" inputMode="numeric" autoComplete="off" required/></label><label className="saas-card-hidden">Emissor<select id="form-checkout__issuer"/></label><label className="saas-card-hidden">Parcelas<select id="form-checkout__installments"/></label></div>{error&&<p role="alert" className="saas-notice">{error}</p>}<button id="form-checkout__submit" type="submit" disabled={disabled||loading}>{loading?'Carregando campos seguros...':disabled?'Processando...':'Autorizar mensalidade'}</button><p className="saas-card-privacy">Ao continuar, você autoriza a cobrança mensal deste barbeiro pelo Mercado Pago. O cartão será tokenizado pela SDK oficial.</p></form>;
}
