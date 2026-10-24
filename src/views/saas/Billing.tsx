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
type TransparentOrder={barberId:string;method:'pix'|'boleto';amountCents:number;orderId:string;expiresAt:string;payment:{ticketUrl?:string|null;qrCode?:string|null;qrCodeBase64?:string|null;barcodeContent?:string|null;digitableLine?:string|null}};
export default function Billing(){
 const {tenant,barbers,bookingAccess,refresh,currentUser}=useData();
 const action=useServerFn(billingAction);
 const [subscriptions,setSubscriptions]=useState<any[]>([]),[paymentOrders,setPaymentOrders]=useState<any[]>([]),[price,setPrice]=useState<number|null>(null),[ready,setReady]=useState(false),[cardReady,setCardReady]=useState(false),[transparentReady,setTransparentReady]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[prepared,setPrepared]=useState<Prepared|null>(null),[paymentChoice,setPaymentChoice]=useState<{barberId:string;barberName:string;amountCents:number}|null>(null),[transparentOrder,setTransparentOrder]=useState<TransparentOrder|null>(null),[method,setMethod]=useState<'pix'|'boleto'|''>(''),[payer,setPayer]=useState({firstName:'',lastName:'',cpf:'',zipCode:'',street:'',number:'',neighborhood:'',city:'',state:''}),[copied,setCopied]=useState(false);
 const load=useCallback(async()=>{
  const [rows,settings,status]=await Promise.all([supabase.from('barber_subscriptions').select('*').eq('tenant_id',tenant.id),supabase.from('saas_settings').select('price_per_barber_cents').eq('id',true).single(),action({data:{action:'status'}})]);
  if(rows.error||settings.error)throw new Error('Não foi possível carregar as mensalidades.');
  const ids=(rows.data||[]).map((s:any)=>s.id);const orders=ids.length?await supabase.from('subscription_payment_orders').select('id,subscription_id,payment_method,state,provider_order_id,expires_at,created_at').in('subscription_id',ids).order('created_at',{ascending:false}):{data:[],error:null};
  if(orders.error)throw new Error('Não foi possível carregar as cobranças Pix e boleto.');
  setSubscriptions(rows.data||[]);setPaymentOrders(orders.data||[]);setPrice(settings.data?.price_per_barber_cents??null);setCardReady(!!status.cardReady);setTransparentReady(!!status.transparentReady);setReady(!!status.cardReady||!!status.transparentReady);
 },[tenant?.id,action]);
 useEffect(()=>{if(currentUser?.role==='admin')void load().catch(e=>setError(e.message));},[load,currentUser?.role]);
 useEffect(()=>{
  if(!prepared&&!paymentChoice&&!transparentOrder)return;
  const previousOverflow=document.body.style.overflow;
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setPrepared(null);setPaymentChoice(null);setTransparentOrder(null);}};
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',closeOnEscape);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',closeOnEscape);};
 },[prepared,paymentChoice,transparentOrder]);
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
 const startTransparentCheckout=async()=>{
  if(!paymentChoice||!method||busy)return;
  const id=paymentChoice.barberId;setBusy(id);setError('');setNotice('');
  try{
   const normalizedCpf=payer.cpf.replace(/\D/g,'');
   if(normalizedCpf.length!==11)throw new Error('Informe um CPF válido com 11 números.');
   if(method==='boleto'&&(!payer.zipCode.replace(/\D/g,'')||!payer.street.trim()||!payer.number.trim()||!payer.neighborhood.trim()||!payer.city.trim()||payer.state.length!==2))throw new Error('Preencha o endereço completo para emitir o boleto.');
   const result:any=await action({data:{action:'checkout',barberId:id,paymentMethod:method,payer:{firstName:payer.firstName.trim(),lastName:payer.lastName.trim(),cpf:normalizedCpf,...(method==='boleto'?{zipCode:payer.zipCode.replace(/\D/g,''),street:payer.street.trim(),number:payer.number.trim(),neighborhood:payer.neighborhood.trim(),city:payer.city.trim(),state:payer.state.toUpperCase()}:{})}}});
   if(result.legacyUrl){window.location.assign(result.legacyUrl);return;}
   if(result.authorized){setPaymentChoice(null);setNotice('Esta assinatura já está autorizada.');await refresh();await load();return;}
   if(!result.transparent)throw new Error('O Mercado Pago não retornou os dados da cobrança. Consulte o pagamento antes de tentar novamente.');
   setTransparentOrder({barberId:id,method,amountCents:result.amountCents,orderId:result.orderId,expiresAt:result.expiresAt,payment:result.payment});setPaymentChoice(null);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível criar a cobrança.');}
  finally{setBusy('');}
 };
 const checkTransparentPayment=async()=>{
  if(!transparentOrder||busy)return;setBusy(transparentOrder.barberId);setError('');
  try{await action({data:{action:'sync',barberId:transparentOrder.barberId}});await refresh();await load();setNotice('Consulta concluída. O acesso será liberado somente após confirmação do Mercado Pago.');setTransparentOrder(null);}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível consultar o pagamento.');}
  finally{setBusy('');}
 };
 if(currentUser?.role!=='admin')return <p>Acesso restrito ao proprietário.</p>;
 const trial=new Date(tenant.trial_ends_at)>new Date();
 const money=(c:number)=> (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 return <div className="saas-admin"><p className="saas-kicker">MENSALIDADE</p><h1>Suas agendas, sob controle.</h1><p>{barbers.length} barbeiro(s) cadastrado(s), incluindo inativos. {price!==null?'Valor atual para novas assinaturas: '+money(price)+' por barbeiro/mês.':'A plataforma ainda não definiu o valor.'}</p><p>{trial?'Teste grátis até '+new Date(tenant.trial_ends_at).toLocaleString('pt-BR')+'. Você pode contratar durante o teste; o período pago começa após o fim do trial.':'O período de teste terminou. Regularize as mensalidades para liberar as agendas.'}</p>
 <p>Cada barbeiro tem sua própria assinatura mensal. Inativar o perfil não cancela a cobrança; use Cancelar assinatura antes de excluir o cadastro.</p>
 {!ready&&<p className="saas-notice">A integração aguarda a configuração das credenciais do Mercado Pago pela plataforma. Pagamentos indisponíveis.</p>}{error&&<p role="alert" className="saas-notice">{error}</p>}{notice&&<p role="status" className="saas-notice">{notice}</p>}
 <div className="saas-grid">{barbers.map((barber:any)=>{const sub=subscriptions.find(s=>s.barber_id===barber.id),paid=sub?.paid_until&&new Date(sub.paid_until).getTime()>Date.now(),pendingOrder=paymentOrders.find(o=>o.subscription_id===sub?.id&&['creating','pending'].includes(o.state)&&(!o.expires_at||new Date(o.expires_at).getTime()>Date.now())),hasPrice=!!price;return <article className="saas-card" key={barber.id}><h2>{barber.name}</h2><p>{bookingAccess[barber.id]?'Agenda liberada':'Agenda bloqueada'} · {barber.active?'Perfil ativo':'Perfil inativo'}</p><p>{sub?.amount_cents?money(sub.amount_cents):price?money(price):'Valor a definir'} / mês</p><p>{sub?.paid_until?'Pago até '+new Date(sub.paid_until).toLocaleDateString('pt-BR'):trial?'Em teste grátis':'Aguardando pagamento'}</p><div className="saas-actions">{!sub?.provider_id&&!paid&&<button disabled={!!busy||!hasPrice||sub?.state==='cancelled'} onClick={()=>{setMethod(pendingOrder?.payment_method||'');setPaymentChoice({barberId:barber.id,barberName:barber.name,amountCents:sub?.amount_cents||price||0});}}>{busy===barber.id?'Aguarde...':pendingOrder?'Continuar pagamento '+(pendingOrder.payment_method==='pix'?'Pix':'boleto'):sub?.state==='creating'?'Continuar configuração':'Contratar mensalidade'}</button>}{sub?.provider_id&&sub.state!=='authorized'&&<button disabled={!!busy} onClick={()=>void run('checkout',barber.id)}>Continuar pagamento iniciado antes do checkout transparente</button>}{(sub?.provider_id||sub?.state==='creating'||sub?.state==='review'||pendingOrder)&&<button disabled={!!busy} onClick={()=>void run('sync',barber.id)}>Consultar pagamento</button>}{sub?.provider_id&&sub.state!=='cancelled'&&<button disabled={!!busy} onClick={()=>void run('cancel',barber.id)}>Cancelar assinatura</button>}</div>{!hasPrice&&sub?.state!=='cancelled'&&<small>A contratação durante o teste está liberada, mas o superadministrador precisa definir o valor mensal para habilitar o pagamento.</small>}{!ready&&sub?.state!=='cancelled'&&<small>Pagamento indisponível: a integração Mercado Pago ainda precisa ser configurada pela plataforma.</small>}{sub?.state==='cancelled'&&<small>Assinatura cancelada. Entre em contato com a plataforma para reativar este cadastro.</small>}</article>;})}</div>
 {paymentChoice&&<div className="saas-checkout-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setPaymentChoice(null);}}><section className="saas-card saas-checkout saas-payment-choice" role="dialog" aria-modal="true" aria-labelledby="payment-choice-title" tabIndex={-1}><button className="saas-checkout-close" type="button" onClick={()=>setPaymentChoice(null)} aria-label="Fechar escolha de pagamento" autoFocus>×</button><p className="saas-kicker">PAGAMENTO SEGURO</p><h2 id="payment-choice-title">Mensalidade de {paymentChoice.barberName}</h2><p><strong>{money(paymentChoice.amountCents)} / mês</strong>{trial?' · teste grátis de 7 dias':''}</p><p>Escolha como deseja pagar:</p><div className="saas-payment-methods"><button type="button" disabled={!!busy||!cardReady} onClick={()=>{const barberId=paymentChoice.barberId;setPaymentChoice(null);void run('prepare',barberId);}}>Cartão de crédito · renovação automática</button><button type="button" disabled={!!busy||!transparentReady} onClick={()=>setMethod('pix')}>Pix · nova cobrança a cada mês</button><button type="button" disabled={!!busy||!transparentReady} onClick={()=>setMethod('boleto')}>Boleto · nova cobrança a cada mês</button></div>{!cardReady&&<small>Cartão indisponível: falta completar as credenciais da aplicação de Assinaturas no Super Admin.</small>}{!transparentReady&&<small>Pix e boleto indisponíveis: falta o Access Token ou o segredo de webhook da aplicação Checkout Transparente.</small>}{error&&<p role="alert" className="saas-notice">{error}</p>}{method&&<div className="saas-invoice-fields"><h3>Dados para o {method==='pix'?'Pix':'boleto'}</h3><label>Nome<input required autoComplete="given-name" value={payer.firstName} onChange={e=>setPayer(v=>({...v,firstName:e.target.value}))}/></label><label>Sobrenome<input required autoComplete="family-name" value={payer.lastName} onChange={e=>setPayer(v=>({...v,lastName:e.target.value}))}/></label><label>CPF<input required inputMode="numeric" autoComplete="off" maxLength={14} value={payer.cpf} onChange={e=>setPayer(v=>({...v,cpf:e.target.value}))}/></label>{method==='boleto'&&<><label>CEP<input required inputMode="numeric" autoComplete="postal-code" value={payer.zipCode} onChange={e=>setPayer(v=>({...v,zipCode:e.target.value}))}/></label><label>Rua<input required autoComplete="address-line1" value={payer.street} onChange={e=>setPayer(v=>({...v,street:e.target.value}))}/></label><label>Número<input required value={payer.number} onChange={e=>setPayer(v=>({...v,number:e.target.value}))}/></label><label>Bairro<input required value={payer.neighborhood} onChange={e=>setPayer(v=>({...v,neighborhood:e.target.value}))}/></label><label>Cidade<input required autoComplete="address-level2" value={payer.city} onChange={e=>setPayer(v=>({...v,city:e.target.value}))}/></label><label>Estado (UF)<input required autoComplete="address-level1" maxLength={2} value={payer.state} onChange={e=>setPayer(v=>({...v,state:e.target.value.toUpperCase()}))}/></label></>}<button type="button" disabled={!!busy} onClick={()=>void startTransparentCheckout()}>{busy?'Gerando cobrança...':`Gerar ${method==='pix'?'Pix':'boleto'}`}</button><button type="button" className="saas-checkout-cancel" onClick={()=>setMethod('')}>Voltar aos meios de pagamento</button></div>}<p className="saas-card-privacy">No Pix e no boleto, a mensalidade seguinte também precisará ser paga pelo painel. A agenda só será liberada depois da confirmação.</p></section></div>}
 {transparentOrder&&<div className="saas-checkout-backdrop"><section className="saas-card saas-checkout saas-transparent-order" role="dialog" aria-modal="true" aria-labelledby="transparent-order-title" tabIndex={-1}><button className="saas-checkout-close" type="button" onClick={()=>setTransparentOrder(null)} aria-label="Fechar cobrança">×</button><p className="saas-kicker">CHECKOUT TRANSPARENTE</p><h2 id="transparent-order-title">Pague com {transparentOrder.method==='pix'?'Pix':'boleto'}</h2><p><strong>{money(transparentOrder.amountCents)}</strong> · {transparentOrder.method==='pix'?'Pix válido até '+new Date(transparentOrder.expiresAt).toLocaleString('pt-BR'):'Confira o vencimento no boleto'}</p>{transparentOrder.method==='pix'?<>{transparentOrder.payment.qrCodeBase64&&<img className="saas-pix-qr" alt="QR Code Pix" src={`data:image/png;base64,${transparentOrder.payment.qrCodeBase64}`}/>}<label>Pix Copia e Cola<textarea readOnly value={transparentOrder.payment.qrCode||''}/></label><button type="button" disabled={!transparentOrder.payment.qrCode} onClick={()=>{void navigator.clipboard.writeText(transparentOrder.payment.qrCode||'').then(()=>setCopied(true));}}>{copied?'Código copiado':'Copiar Pix'}</button></>:<>{transparentOrder.payment.digitableLine&&<label>Linha digitável<input readOnly value={transparentOrder.payment.digitableLine}/></label>}{transparentOrder.payment.barcodeContent&&<label>Código de barras<input readOnly value={transparentOrder.payment.barcodeContent}/></label>}{transparentOrder.payment.ticketUrl&&<a className="saas-order-ticket" href={transparentOrder.payment.ticketUrl} target="_blank" rel="noreferrer">Abrir boleto para imprimir</a>}</>}<p className="saas-card-privacy">O pagamento pode levar algumas horas para ser confirmado. Aguarde a confirmação antes de tentar pagar novamente.</p>{error&&<p role="alert" className="saas-notice">{error}</p>}<button type="button" disabled={!!busy} onClick={()=>void checkTransparentPayment()}>{busy?'Consultando...':'Já paguei · consultar status'}</button></section></div>}
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
