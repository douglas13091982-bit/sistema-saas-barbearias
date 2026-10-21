import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { billingAction } from '@/lib/billing.functions';
import '@/styles/saas.css';

export default function Billing(){
 const {tenant,barbers,bookingAccess,refresh,currentUser}=useData();
 const action=useServerFn(billingAction);
 const [subscriptions,setSubscriptions]=useState<any[]>([]),[price,setPrice]=useState<number|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
 const load=useCallback(async()=>{
  const [rows,settings,status]=await Promise.all([supabase.from('barber_subscriptions').select('*').eq('tenant_id',tenant.id),supabase.from('saas_settings').select('price_per_barber_cents').eq('id',true).single(),action({data:{action:'status'}})]);
  if(rows.error||settings.error)throw new Error('Não foi possível carregar as mensalidades.');
  setSubscriptions(rows.data||[]);setPrice(settings.data?.price_per_barber_cents??null);setReady(!!status.ready);
 },[tenant?.id,action]);
 useEffect(()=>{if(currentUser?.role==='admin')void load().catch(e=>setError(e.message));},[load,currentUser?.role]);
 const run=async(type:'checkout'|'sync'|'cancel',id:string)=>{
  if(busy)return;if(type==='cancel'&&!confirm('Cancelar as próximas cobranças deste barbeiro? A agenda permanece liberada apenas até o fim do período já pago.'))return;
  setBusy(id);setError('');
  try{const result=await action({data:{action:type,barberId:id}});if('url' in result&&result.url){window.location.assign(result.url);return;}await refresh();await load();if('authorized' in result)setError('Assinatura autorizada. A liberação depende da confirmação do pagamento. Use Consultar pagamento.');}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}finally{setBusy('');}
 };
 if(currentUser?.role!=='admin')return <p>Acesso restrito ao proprietário.</p>;
 const trial=new Date(tenant.trial_ends_at)>new Date();
 const money=(c:number)=> (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 return <div className="saas-admin"><p className="saas-kicker">MENSALIDADE</p><h1>Suas agendas, sob controle.</h1><p>{barbers.length} barbeiro(s) cadastrado(s), incluindo inativos. {price!==null?'Valor atual para novas assinaturas: '+money(price)+' por barbeiro/mês.':'A plataforma ainda não definiu o valor.'}</p><p>{trial?'Teste grátis até '+new Date(tenant.trial_ends_at).toLocaleString('pt-BR')+'. Depois disso, cada agenda exige pagamento confirmado.':'O período de teste terminou. Regularize as mensalidades para liberar as agendas.'}</p>
 <p>Cada barbeiro tem sua própria assinatura mensal. Inativar o perfil não cancela a cobrança; use Cancelar assinatura antes de excluir o cadastro.</p>
 {!ready&&<p className="saas-notice">A plataforma ainda precisa configurar o Mercado Pago. Pagamentos indisponíveis.</p>}{error&&<p role="alert" className="saas-notice">{error}</p>}
 <div className="saas-grid">{barbers.map((barber:any)=>{const sub=subscriptions.find(s=>s.barber_id===barber.id);return <article className="saas-card" key={barber.id}><h2>{barber.name}</h2><p>{bookingAccess[barber.id]?'Agenda liberada':'Agenda bloqueada'} · {barber.active?'Perfil ativo':'Perfil inativo'}</p><p>{sub?.amount_cents?money(sub.amount_cents):price?money(price):'Valor a definir'} / mês</p><p>{sub?.paid_until?'Pago até '+new Date(sub.paid_until).toLocaleDateString('pt-BR'):trial?'Em teste grátis':'Aguardando pagamento'}</p><div className="saas-actions"><button disabled={!ready||!!busy||!price||sub?.state==='cancelled'} onClick={()=>void run('checkout',barber.id)}>{busy===barber.id?'Aguarde...':sub?.provider_id?'Abrir pagamento':'Contratar mensalidade'}</button>{sub?.provider_id&&<><button disabled={!!busy} onClick={()=>void run('sync',barber.id)}>Consultar pagamento</button>{sub.state!=='cancelled'&&<button disabled={!!busy} onClick={()=>void run('cancel',barber.id)}>Cancelar assinatura</button>}</>}</div>{sub?.state==='cancelled'&&<small>Assinatura cancelada. Você pode excluir este cadastro e cadastrar novamente para iniciar uma nova assinatura.</small>}</article>;})}</div>
 {barbers.length===0&&<p>Cadastre seu primeiro profissional em Barbeiros para começar.</p>}
 </div>;
}
