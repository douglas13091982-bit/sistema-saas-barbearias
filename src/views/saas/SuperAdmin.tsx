import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { platformBillingStatus } from '@/lib/billing.functions';
import '@/styles/saas.css';
import { PhotoUpload } from '@/components/PhotoUpload';
import { AdminPanelSwitcher } from '@/components/AdminPanelSwitcher';

export default function SuperAdmin(){
 const {isPlatformAdmin,tenant,currentUser}=useData();const check=useServerFn(platformBillingStatus);
 const [tenants,setTenants]=useState<any[]>([]),[seats,setSeats]=useState<any[]>([]),[price,setPrice]=useState(''),[name,setName]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const [logo,setLogo]=useState(''),[photoBusy,setPhotoBusy]=useState(false),[brandingBusy,setBrandingBusy]=useState(false),[brandingLoaded,setBrandingLoaded]=useState(false);
 const load=useCallback(async()=>{
  const [shops,subscriptions,settings,status]=await Promise.all([supabase.from('tenants').select('*').order('created_at',{ascending:false}),supabase.from('barber_subscriptions').select('*').is('archived_at',null),supabase.from('saas_settings').select('*').eq('id',true).single(),check()]);
  if(shops.error||subscriptions.error||settings.error)throw new Error('Falha ao carregar a plataforma.');setTenants(shops.data||[]);setSeats(subscriptions.data||[]);setPrice(settings.data?.price_per_barber_cents===null?'':String((settings.data?.price_per_barber_cents||0)/100));setName(settings.data?.name||'');setLogo(settings.data?.logo||'');setBrandingLoaded(true);setReady(status.ready);
 },[check]);
 useEffect(()=>{if(isPlatformAdmin)void load().catch(e=>setNotice(e.message));},[isPlatformAdmin,load]);
 if(!isPlatformAdmin)return <main className="saas-page"><h1>Acesso restrito ao superadministrador.</h1><a href="/admin/login">Entrar</a></main>;
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);try{const cents=Math.round(Number(price.replace(',','.'))*100);if(!Number.isSafeInteger(cents)||cents<100)throw new Error('Informe um valor a partir de R$ 1,00.');const {error}=await supabase.from('saas_settings').update({price_per_barber_cents:cents,updated_at:new Date().toISOString()}).eq('id',true);if(error)throw error;setNotice('Valores salvos. Novas assinaturas usarão este preço; assinaturas existentes mantêm o valor contratado.');}catch{setNotice('Não foi possível salvar. Verifique o valor e tente novamente.');}finally{setBusy(false);}};
 const saveBranding=async(e:React.FormEvent)=>{
  e.preventDefault();if(!brandingLoaded||photoBusy||brandingBusy)return;setBrandingBusy(true);setNotice('');
  try{if(name.trim().length<2||name.trim().length>120)throw new Error('Use um nome com 2 a 120 caracteres.');
   const {data,error}=await supabase.from('saas_settings').update({name:name.trim(),logo,updated_at:new Date().toISOString()}).eq('id',true).select('name,logo').single();
   if(error||!data)throw new Error('Não foi possível salvar a identidade. Tente novamente.');
   setName(data.name);setLogo(data.logo);setNotice('Nome e logo salvos. A página inicial já usará sua nova identidade.');
  }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBrandingBusy(false);}
 };
 const toggle=async(shop:any)=>{if(!confirm(shop.status==='active'?'Bloquear o site e novos agendamentos desta barbearia?':'Liberar novamente esta barbearia?'))return;const {error}=await supabase.from('tenants').update({status:shop.status==='active'?'blocked':'active'}).eq('id',shop.id);if(error)setNotice('Não foi possível alterar o status.');else await load();};
 return <main className="saas-page"><AdminPanelSwitcher active="platform" /><p className="saas-kicker">SUPERADMINISTRADOR</p><h1>Sua plataforma de barbearias.</h1><p>{tenants.length} barbearias · {seats.length} cadastros de barbeiros · {seats.filter(s=>s.paid_until&&new Date(s.paid_until)>new Date()).length} agendas com pagamento vigente</p><form className="saas-card saas-form" onSubmit={saveBranding}><h2>Identidade da página inicial</h2><label>Nome exibido no SaaS<input value={name} minLength={2} maxLength={120} required disabled={!brandingLoaded||brandingBusy} onChange={e=>setName(e.target.value)}/></label><PhotoUpload id="saas-logo" label="Logo do SaaS" value={logo} onChange={setLogo} onBusyChange={setPhotoBusy} disabled={!brandingLoaded||brandingBusy} maxEdge={640}/><button disabled={!brandingLoaded||brandingBusy||photoBusy}>{photoBusy?'Preparando logo...':brandingBusy?'Salvando...':'Salvar nome e logo'}</button></form><form className="saas-card saas-form" onSubmit={save}><h2>Configuração comercial</h2><label>Mensalidade por barbeiro (R$)<input type="text" inputMode="decimal" required value={price} onChange={e=>setPrice(e.target.value)}/></label><p>Teste grátis: 7 dias por barbearia. A cobrança inclui todos os barbeiros cadastrados, mesmo inativos.</p><button disabled={busy}>{busy?'Salvando...':'Salvar valores'}</button></form><p className="saas-notice">Mercado Pago: {ready?'configurado':'aguardando credenciais seguras no ambiente do projeto'}. Webhook: /api/mercadopago/webhook</p>{notice&&<p role="status">{notice}</p>}
 <div className="saas-grid">{tenants.map(shop=><article className="saas-card" key={shop.id}><h2>{shop.name}</h2><p>/{shop.slug} · {shop.status==='active'?'Ativa':'Bloqueada'}</p><p>{seats.filter(s=>s.tenant_id===shop.id).length} barbeiro(s) · teste até {new Date(shop.trial_ends_at).toLocaleDateString('pt-BR')}</p><div className="saas-actions"><a href={'/'+shop.slug}>Ver site</a>{shop.id===tenant?.id && currentUser?.role==='admin' && <a className="saas-button" href="/admin/dashboard">Administrar minha barbearia</a>}<button onClick={()=>void toggle(shop)}>{shop.status==='active'?'Bloquear':'Desbloquear'}</button></div></article>)}</div></main>;
}
