import { useCallback,useEffect,useMemo,useState,type FormEvent, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { platformBillingStatus, savePlatformMercadoConfig, validatePlatformMercadoConfig } from '@/lib/billing.functions';
import { PhotoUpload } from '@/components/PhotoUpload';
import { Activity,ArrowDownRight,BadgeDollarSign,CalendarDays,CheckCircle2,ChevronRight,Clock3,CircleDollarSign,ExternalLink,LayoutDashboard,Menu,Scissors,Settings2,ShieldCheck,Store,Users,X } from 'lucide-react';
import '@/styles/saas.css';
import '@/styles/saas-admin.css';
type Shop={id:string;name:string;slug:string;status:string;created_at:string;trial_ends_at:string;owner_id:string|null};
type Seat={id:string;tenant_id:string;barber_id:string;amount_cents:number|null;state:string;paid_until:string|null;archived_at:string|null;manual_access:boolean};
type Sale={payment_at:string;period_end:string;amount_cents:number;approved:boolean;updated_at:string;shop_name:string;shop_slug:string;barber_name:string;subscription_state:string};
type Tab='overview'|'shops'|'sales'|'settings';
const tabs:{id:Tab;label:string;icon:typeof Store}[]=[{id:'overview',label:'Visão geral',icon:LayoutDashboard},{id:'shops',label:'Barbearias',icon:Store},{id:'sales',label:'Vendas e planos',icon:BadgeDollarSign},{id:'settings',label:'Configurações',icon:Settings2}];
const money=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const date=(v?:string|null)=>v?new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(v)):'—';
export default function SuperAdmin(){
 const {isPlatformAdmin,tenant,currentUser}=useData(),check=useServerFn(platformBillingStatus),saveMpConfig=useServerFn(savePlatformMercadoConfig),testMpConfig=useServerFn(validatePlatformMercadoConfig);
 const [shops,setShops]=useState<Shop[]>([]),[seats,setSeats]=useState<Seat[]>([]),[sales,setSales]=useState<Sale[]>([]);
 const [manualShop,setManualShop]=useState<Shop|null>(null),[manualBusy,setManualBusy]=useState('');
 const [price,setPrice]=useState(''),[name,setName]=useState(''),[logo,setLogo]=useState('');
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[billingReady,setBillingReady]=useState(false);
 const [mpBusy,setMpBusy]=useState(false),[mpTestBusy,setMpTestBusy]=useState(false),[mpValidation,setMpValidation]=useState<{authenticated:boolean;subscriptionsApi:boolean;pix:boolean;boleto:boolean;card:boolean}|null>(null),[mpConfigStatus,setMpConfigStatus]=useState<Record<string,boolean>>({});
 const [mpFields,setMpFields]=useState({accessToken:'',webhookSecret:'',publicKey:'',appUrl:'https://menubarber.lovable.app'});
 const [busy,setBusy]=useState(false),[photoBusy,setPhotoBusy]=useState(false),[brandBusy,setBrandBusy]=useState(false);
 const [tab,setTab]=useState<Tab>('overview'),[open,setOpen]=useState(false),[period,setPeriod]=useState('90'),[search,setSearch]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const [a,b,c,d,e]=await Promise.all([
    supabase.from('tenants').select('id,name,slug,status,created_at,trial_ends_at,owner_id').order('created_at',{ascending:false}),
    supabase.from('barber_subscriptions').select('id,tenant_id,barber_id,amount_cents,state,paid_until,archived_at,manual_access').is('archived_at',null),
    supabase.from('saas_settings').select('name,logo,price_per_barber_cents').eq('id',true).single(),
    check(),supabase.rpc('platform_sales_history',{}),
   ]);
   if(a.error||b.error||c.error||e.error)throw new Error('Não foi possível carregar todos os dados. Tente atualizar a página.');
   setShops(a.data||[]);setSeats(b.data||[]);setName(c.data.name||'');setLogo(c.data.logo||'');
   setPrice(c.data.price_per_barber_cents==null?'':String(c.data.price_per_barber_cents/100));setBillingReady(!!d.ready);setMpConfigStatus((d as any).config||{});setSales((e.data||[]) as Sale[]);
  }catch(e){setError(e instanceof Error?e.message:'Falha ao carregar.');}finally{setLoading(false);}
 },[check]);
 useEffect(()=>{if(isPlatformAdmin)void load();},[isPlatformAdmin,load]);
 useEffect(()=>{if(!open)return;const f=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[open]);
 const paid=seats.filter(s=>s.paid_until&&new Date(s.paid_until).getTime()>Date.now());
 const active=shops.filter(s=>s.status==='active').length;
 const trials=shops.filter(s=>s.status==='active'&&new Date(s.trial_ends_at).getTime()>Date.now()).length;
 const recurring=paid.filter(s=>s.state==='authorized');
 const approved=sales.filter(s=>s.approved),gross=approved.reduce((n,s)=>n+s.amount_cents,0),mrr=recurring.reduce((n,s)=>n+(s.amount_cents||0),0);
 const filtered=useMemo(()=>{const cutoff=period==='all'?0:Date.now()-Number(period)*86400000,q=search.trim().toLocaleLowerCase('pt-BR');return sales.filter(s=>new Date(s.payment_at).getTime()>=cutoff&&(!q||s.shop_name.toLocaleLowerCase('pt-BR').includes(q)||s.shop_slug.toLocaleLowerCase('pt-BR').includes(q)||s.barber_name.toLocaleLowerCase('pt-BR').includes(q)));},[sales,period,search]);
 const months=useMemo(()=>Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return{key,label:new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(d).replace('.',''),value:approved.filter(x=>x.payment_at.slice(0,7)===key).reduce((n,x)=>n+x.amount_cents,0)};}),[sales]);
 const max=Math.max(1,...months.map(m=>m.value));
 if(!isPlatformAdmin)return <main className="saas-page"><h1>Acesso restrito ao superadministrador.</h1><a href="/admin/login">Entrar</a></main>;
 const selectTab=(v:Tab)=>{setTab(v);setOpen(false);setNotice('');};
 const saveBrand=async(e:FormEvent)=>{e.preventDefault();if(photoBusy||brandBusy)return;setBrandBusy(true);setNotice('');try{if(name.trim().length<2||name.trim().length>120)throw new Error('Use um nome com 2 a 120 caracteres.');const {data,error}=await supabase.from('saas_settings').update({name:name.trim(),logo,updated_at:new Date().toISOString()}).eq('id',true).select('name,logo').single();if(error||!data)throw new Error('Não foi possível salvar a identidade.');setName(data.name);setLogo(data.logo);setNotice('Nome e logo salvos.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível salvar.');}finally{setBrandBusy(false);}};
 const savePrice=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setNotice('');try{const cents=Math.round(Number(price.replace(',','.'))*100);if(!Number.isSafeInteger(cents)||cents<100)throw new Error('Informe um valor a partir de R$ 1,00.');const {data,error}=await supabase.from('saas_settings').update({price_per_barber_cents:cents,updated_at:new Date().toISOString()}).eq('id',true).select('price_per_barber_cents').maybeSingle();if(error||data?.price_per_barber_cents!==cents)throw new Error('O banco não confirmou o preço. Verifique se você está no Super Admin e tente novamente.');setPrice(String(cents/100));setNotice('Preço confirmado e salvo. Atualize a página de mensalidade da barbearia.');}catch(e){setNotice(e instanceof Error?e.message:'Verifique o valor.');}finally{setBusy(false);}};
 const saveMercadoPago=async(e:FormEvent)=>{e.preventDefault();setMpBusy(true);setNotice('');try{const {config}=await saveMpConfig({data:mpFields});const saved:any=config||{};setMpConfigStatus(saved);setBillingReady(!!saved.accessTokenConfigured&&!!saved.webhookSecretConfigured&&!!saved.publicKeyConfigured&&!!saved.appUrlConfigured);setMpFields(v=>({...v,accessToken:'',webhookSecret:'',publicKey:''}));setMpValidation(null);setNotice('Credenciais do Checkout Transparente salvas. Os campos de chave foram limpos.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível salvar as configurações.');}finally{setMpBusy(false);}};
 const validateMercadoPago=async()=>{setMpTestBusy(true);setMpValidation(null);setNotice('');try{const result=await testMpConfig();setMpValidation(result);setNotice('Teste concluído para a aplicação configurada. Confira abaixo se as APIs e os meios de pagamento estão disponíveis.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível validar a aplicação do Mercado Pago.');}finally{setMpTestBusy(false);}};
 const toggle=async(s:Shop)=>{if(!confirm(s.status==='active'?'Bloquear esta barbearia e novos agendamentos?':'Liberar esta barbearia?'))return;const {error}=await supabase.from('tenants').update({status:s.status==='active'?'blocked':'active'}).eq('id',s.id);if(error)setNotice('Não foi possível alterar o status.');else{setNotice('Status atualizado.');await load();}};
 const setManualAccess=async(seat:Seat)=>{if(manualBusy)return;const enable=!seat.manual_access;if(!window.confirm(enable?'Liberar gratuitamente a agenda deste barbeiro?':'Revogar a liberação manual deste barbeiro?'))return;setManualBusy(seat.id);setNotice('');try{const {error}=await supabase.rpc('platform_set_barber_manual_access',{subscription_id:seat.id,enabled:enable});if(error)throw error;setSeats(v=>v.map(x=>x.id===seat.id?{...x,manual_access:enable}:x));setNotice(enable?'Agenda liberada manualmente, sem cobrança.':'Liberação manual revogada.');}catch(e){setNotice(e instanceof Error?e.message:'Não foi possível alterar a liberação.');}finally{setManualBusy('');}};
 const currentTab=tabs.find(t=>t.id===tab);
 return <div className="sa-shell">
  {manualShop&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-label="Liberação manual de barbeiros" className="w-full max-w-xl rounded-xl border border-white/20 bg-[#191919] p-5 text-white shadow-2xl"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Liberar barbeiros</h2><p className="text-sm text-white/60">{manualShop.name} · liberação gratuita pelo Super Admin</p></div><button type="button" aria-label="Fechar" onClick={()=>setManualShop(null)}><X size={22}/></button></div><div className="space-y-3">{seats.filter(x=>x.tenant_id===manualShop.id).map((seat,i)=><div key={seat.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div><strong>Barbeiro {i+1}</strong><p className="text-xs text-white/50">ID: {seat.barber_id}</p><p className="text-xs">{seat.manual_access?'Liberado manualmente':seat.paid_until&&new Date(seat.paid_until)>new Date()?'Pagamento vigente':'Sem liberação manual'}</p></div><button type="button" disabled={!!manualBusy} onClick={()=>void setManualAccess(seat)} className="rounded-lg border border-[#c9a96e] px-3 py-2 text-sm text-[#c9a96e] disabled:opacity-50">{manualBusy===seat.id?'Aguarde...':seat.manual_access?'Revogar liberação':'Liberar grátis'}</button></div>)}{!seats.some(x=>x.tenant_id===manualShop.id)&&<p>Nenhum barbeiro cadastrado nesta barbearia.</p>}</div><p className="mt-4 text-xs text-white/50">A liberação manual não registra pagamento nem altera o histórico financeiro. Revogá-la não cancela pagamentos vigentes.</p></section></div>}
  {open&&<button className="sa-overlay" aria-label="Fechar navegação" onClick={()=>setOpen(false)}/>}
  <aside className={'sa-sidebar '+(open?'sa-sidebar-open':'')}>
   <a href="/super-admin" className="sa-brand">{logo?<img src={logo} alt="" className="sa-brand-logo"/>:<span className="sa-brand-mark"><Scissors size={20}/></span>}<span><strong>{name||'BarberShop'}</strong><small>PLATAFORMA SAAS</small></span></a>
   <p className="sa-sidebar-label">GERENCIAMENTO</p><nav className="sa-nav" aria-label="Menu do Super Admin">{tabs.map(t=><button key={t.id} className={tab===t.id?'active':''} onClick={()=>selectTab(t.id)}><t.icon size={17}/><span>{t.label}</span>{tab===t.id&&<ChevronRight className="sa-nav-arrow" size={15}/>}</button>)}</nav>
   <div className="sa-sidebar-bottom"><a href="/admin"><Store size={17}/><span>Minha barbearia</span></a><a href="/barbershop-pro" target="_blank" rel="noreferrer"><ExternalLink size={16}/><span>Ver site da barbearia</span></a><div className="sa-user"><span className="sa-avatar">{currentUser?.name?.[0]||'A'}</span><span><strong>{currentUser?.name||'Administrador'}</strong><small>Super administrador</small></span><ShieldCheck size={17}/></div></div>
  </aside>
  <div className="sa-main"><header className="sa-topbar"><button className="sa-mobile-home" data-home={tab==='overview'} onClick={()=>selectTab('overview')} aria-label="Voltar aos módulos do Super Admin"><LayoutDashboard size={19}/><span>Painel</span></button><div className="sa-breadcrumb">Super Admin <ChevronRight size={14}/><strong>{currentTab?.label}</strong></div><div className="sa-topbar-actions"><a href="/admin" className="sa-mobile-shop-link" aria-label="Abrir painel da minha barbearia"><Store size={16}/><span>Minha barbearia</span></a><span className={'sa-connection '+(billingReady?'ready':'')}><i/>{billingReady?'Mercado Pago conectado':'Mercado Pago pendente'}</span><button onClick={()=>void load()} aria-label="Atualizar dados" title="Atualizar"><Activity size={17}/></button></div></header>
   <main className="sa-content">{error&&<div className="sa-alert" role="alert">{error}<button onClick={()=>void load()}>Tentar novamente</button></div>}{notice&&<div className="sa-alert sa-success" role="status"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')} aria-label="Fechar"><X size={16}/></button></div>}{loading&&<div className="sa-loading">Carregando dados da plataforma...</div>}
    {!loading&&tab==='overview'&&<nav className="sa-mobile-hub" aria-label="Módulos do Super Admin">{tabs.map(t=><button key={t.id} className={'sa-mobile-module '+(tab===t.id?'active':'')} onClick={()=>selectTab(t.id)}><t.icon size={27} strokeWidth={1.7}/><span>{t.label}</span></button>)}</nav>}
    {!loading&&tab==='overview'&&<><Heading kicker="PAINEL DA PLATAFORMA" title="Visão geral" text="Acompanhe as barbearias, as agendas e o faturamento do SaaS." action={<button className="sa-primary" onClick={()=>selectTab('shops')}><Store size={16}/>Ver barbearias</button>}/>
     <section className="sa-platform-summary" aria-label="Resumo da plataforma">
       <article className="sa-platform-revenue">
         <CircleDollarSign size={24} aria-hidden="true" />
         <h2>Receita recorrente mensal</h2>
         <strong>{money(mrr)}</strong>
         <p>{paid.length} agendas pagas vigentes</p>
         <button type="button" className="sa-link-button" onClick={() => selectTab('sales')}>Ver vendas e planos <ChevronRight size={15} /></button>
       </article>
       <div className="sa-platform-counts">
         <Metric icon={Store} label="Barbearias" value={shops.length} hint={active+' ativas'}/>
         <Metric icon={Clock3} label="Em teste grátis" value={trials} hint="Teste de 7 dias"/>
         <Metric icon={Users} label="Barbeiros cadastrados" value={seats.length} hint={paid.length+' com agenda paga'}/>
         <Metric icon={BadgeDollarSign} label="Vendas aprovadas" value={approved.length} hint={money(gross)+' no histórico'}/>
         <Metric icon={Activity} label="Bloqueadas" value={shops.length-active} hint="Acesso suspenso"/>
       </div>
     </section>
     <section className="sa-overview-grid"><article className="sa-panel sa-chart-panel"><PanelTitle title="Receita aprovada" subtitle="Por mês de confirmação · últimos seis meses"/>{approved.length===0?<Empty icon={BadgeDollarSign} title="As vendas aparecerão aqui" text="Ainda não há pagamentos aprovados no histórico."/>:<div className="sa-chart">{months.map(m=><div className="sa-bar-wrap" key={m.key}><span>{m.value?money(m.value):'—'}</span><div className="sa-bar-track"><i style={{height:(m.value?Math.max(8,m.value/max*100):0)+'%'}}/></div><small>{m.label}</small></div>)}</div>}</article><article className="sa-panel"><PanelTitle title="Saúde da plataforma" subtitle="Resumo da operação"/><Health label="Barbearias ativas" value={active} total={shops.length}/><Health label="Em teste grátis" value={trials} total={shops.length}/><Health label="Agendas pagas" value={paid.length} total={seats.length}/><div className="sa-health-foot"><span>Mensalidade atual</span><strong>{price?money(Math.round(Number(price.replace(',','.'))*100)):'A definir'} / barbeiro</strong></div></article></section>
     <SalesTable rows={sales.slice(0,6)} compact seeAll={()=>selectTab('sales')}/>
    </>}
    {!loading&&tab==='shops'&&<><Heading kicker="CONTAS E OPERAÇÃO" title="Barbearias" text="Contas cadastradas, período de teste, agendas pagas e acesso."/><section className="sa-shop-summary"><span><Store size={18}/>{shops.length} no total</span><span><CheckCircle2 size={18}/>{active} ativas</span><span><Clock3 size={18}/>{trials} em teste</span><span><Users size={18}/>{seats.length} barbeiros</span></section><div className="sa-shop-directory">
      {shops.map(shop => {
        const shopSeats = seats.filter(seat => seat.tenant_id === shop.id);
        const paidCount = shopSeats.filter(seat => seat.paid_until && new Date(seat.paid_until).getTime() > Date.now()).length;
        const remainingDays = Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000));
        const isActive = shop.status === 'active';
        return (
          <article className="sa-panel sa-shop-card" key={shop.id}>
            <header>
              <div><h2>{shop.name}</h2><p>/{shop.slug}{shop.owner_id === currentUser?.id ? ' · sua barbearia' : ''}</p></div>
              <span className={`sa-status ${isActive ? 'active' : 'blocked'}`}>{isActive ? 'Ativa' : 'Bloqueada'}</span>
            </header>
            <dl>
              <div><dt>Cadastro</dt><dd>{date(shop.created_at)}</dd></div>
              <div><dt>Teste grátis</dt><dd>{remainingDays ? remainingDays + ' dias restantes' : 'Encerrado · ' + date(shop.trial_ends_at)}</dd></div>
              <div><dt>Barbeiros</dt><dd>{shopSeats.length}</dd></div>
              <div><dt>Agendas pagas</dt><dd>{paidCount}</dd></div>
            </dl>
            <footer className="sa-row-actions">
              <a href={'/' + shop.slug} target="_blank" rel="noreferrer" aria-label={`Abrir site de ${shop.name}`}><ExternalLink size={15} /></a>
              {shop.id === tenant?.id && <a href="/admin/dashboard" aria-label="Administrar minha barbearia"><Scissors size={15} /></a>}
              <button type="button" onClick={() => setManualShop(shop)}>Liberar barbeiros</button>
              <button type="button" onClick={() => void toggle(shop)}>{isActive ? 'Bloquear' : 'Liberar'}</button>
            </footer>
          </article>
        );
      })}
      {shops.length === 0 && <p className="sa-panel">Nenhuma barbearia cadastrada.</p>}
    </div></>}
    {!loading&&tab==='sales'&&<><Heading kicker="FATURAMENTO" title="Vendas e planos" text="Histórico de pagamentos confirmados e reversões das assinaturas."/><section className="sa-sales-metrics"><Metric icon={BadgeDollarSign} label="Vendas aprovadas" value={filtered.filter(x=>x.approved).length} hint={money(filtered.filter(x=>x.approved).reduce((n,x)=>n+x.amount_cents,0))+' no período'}/><Metric icon={ArrowDownRight} label="Estornos / reversões" value={filtered.filter(x=>!x.approved).length} hint="Excluídos da receita vigente"/><Metric icon={CircleDollarSign} label="Receita recorrente atual" value={money(mrr)} hint={paid.length+' agendas pagas'}/></section><div className="sa-filters"><label className="sa-search">Buscar barbearia ou profissional<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite para filtrar..."/></label><label>Período<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o histórico</option></select></label></div><SalesTable rows={filtered}/></>}
    {!loading&&tab==='settings'&&<><Heading kicker="APARÊNCIA E COBRANÇA" title="Configurações" text="Identidade da plataforma e regras de mensalidade."/><div className="sa-settings-grid"><form className="sa-panel sa-settings-form" onSubmit={saveBrand}><PanelTitle title="Identidade do SaaS" subtitle="Nome e logo da página inicial"/><label>Nome exibido<input value={name} minLength={2} maxLength={120} required onChange={e=>setName(e.target.value)}/></label><PhotoUpload id="saas-logo" label="Logo do SaaS" value={logo} onChange={setLogo} onBusyChange={setPhotoBusy} disabled={brandBusy} maxEdge={640}/><button className="sa-primary" disabled={brandBusy||photoBusy}>{photoBusy?'Preparando...':brandBusy?'Salvando...':'Salvar identidade'}</button></form><form className="sa-panel sa-settings-form" onSubmit={savePrice}><PanelTitle title="Preço dos planos" subtitle="Valor por barbeiro cadastrado"/><label>Mensalidade mensal<input type="text" inputMode="decimal" required value={price} onChange={e=>setPrice(e.target.value)} placeholder="Ex.: 29,90"/></label><div className="sa-plan-info"><span>Teste grátis</span><strong>7 dias por barbearia</strong><span>Contagem</span><strong>Inclui barbeiros inativos</strong><span>Atualização</span><strong>Preço novo vale para novos contratos</strong></div><button className="sa-primary" disabled={busy}>{busy?'Salvando...':'Salvar preço'}</button></form></div>
     <form className="sa-panel sa-settings-form sa-mp-config" onSubmit={saveMercadoPago}>
      <PanelTitle title="Checkout Transparente" subtitle="Configure uma única aplicação Mercado Pago para os pagamentos da plataforma."/>
      <p className="sa-mp-help">Use as credenciais da aplicação Checkout Transparente. O Access Token e o segredo de webhook serão usados nos pagamentos Pix, boleto e cartão; a Public Key inicializa o formulário seguro de cartão. As chaves privadas ficam no cofre e não aparecem depois de salvas. Deixe os campos de chave vazios para manter as atuais.</p>
      <label>Access Token (privado)<input type="password" autoComplete="new-password" value={mpFields.accessToken} onChange={e=>setMpFields(v=>({...v,accessToken:e.target.value}))} placeholder={mpConfigStatus['ordersAccessTokenConfigured']||mpConfigStatus['accessTokenConfigured']?'Configurado · deixe vazio para manter':'Cole o Access Token de produção da aplicação Checkout Transparente'}/><small className="sa-mp-state">{mpConfigStatus['ordersAccessTokenConfigured']||mpConfigStatus['accessTokenConfigured']?'Configurado':'Pendente'}</small></label>
      <label>Public Key<input value={mpFields.publicKey} onChange={e=>setMpFields(v=>({...v,publicKey:e.target.value}))} placeholder={mpConfigStatus['publicKeyConfigured']?'Configurada · deixe vazio para manter':'Cole a Public Key de produção da mesma aplicação'}/><small className="sa-mp-state">{mpConfigStatus['publicKeyConfigured']?'Configurada':'Pendente'}</small></label>
      <label>Segredo de assinatura do webhook<input type="password" autoComplete="new-password" value={mpFields.webhookSecret} onChange={e=>setMpFields(v=>({...v,webhookSecret:e.target.value}))} placeholder={mpConfigStatus['ordersWebhookSecretConfigured']||mpConfigStatus['webhookSecretConfigured']?'Configurado · deixe vazio para manter':'Cole o segredo de webhook desta aplicação'}/><small className="sa-mp-state">{mpConfigStatus['ordersWebhookSecretConfigured']||mpConfigStatus['webhookSecretConfigured']?'Configurado':'Pendente'}</small></label>
      <div className="sa-mp-webhook"><strong>URL para cadastrar no Mercado Pago</strong><code>https://menubarber.lovable.app/api/mercadopago/webhook</code></div>
      <button className="sa-primary" disabled={mpBusy}>{mpBusy?'Salvando credenciais...':'Salvar configuração'}</button>
      <button type="button" className="sa-checkout-cancel" disabled={mpTestBusy} onClick={()=>void validateMercadoPago()}>{mpTestBusy?'Validando aplicação...':'Testar conexão e meios de pagamento'}</button>
      {mpValidation&&<div className="sa-mp-validation" role="status"><strong>Teste da aplicação concluído</strong><span>API de assinaturas: {mpValidation.subscriptionsApi?'disponível':'indisponível'} · Cartão: {mpValidation.card?'disponível':'não listado'} · Pix: {mpValidation.pix?'disponível':'não listado'} · Boleto: {mpValidation.boleto?'disponível':'não listado'}</span></div>}
     </form>
     <article className="sa-panel sa-integration"><div><span className={'sa-integration-dot '+(billingReady?'ready':'')}/><div><strong>Mercado Pago</strong><p>{billingReady?'Integração pronta para receber pagamentos.':'Preencha e salve as credenciais acima para ativar os pagamentos.'}</p></div></div></article></>}
   </main>
  </div>
 </div>;
}
function Heading({kicker,title,text,action}:{kicker:string;title:string;text:string;action?:ReactNode}){return <div className="sa-page-heading"><div><p className="sa-eyebrow">{kicker}</p><h1>{title}</h1><p>{text}</p></div>{action}</div>;}
function Metric({icon:Icon,label,value,hint}:{icon:typeof Store;label:string;value:string|number;hint:string}){return <article className="sa-metric"><span className="sa-metric-icon"><Icon size={18}/></span><span className="sa-metric-label">{label}</span><strong className="sa-metric-value">{value}</strong><small>{hint}</small></article>;}
function PanelTitle({title,subtitle}:{title:string;subtitle:string}){return <div className="sa-panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><span className="sa-panel-icon"><Activity size={18}/></span></div>;}
function Empty({icon:Icon,title,text}:{icon:typeof Store;title:string;text:string}){return <div className="sa-empty-chart"><Icon size={26}/><strong>{title}</strong><span>{text}</span></div>;}
function Health({label,value,total}:{label:string;value:number;total:number}){return <div className="sa-health-row"><div><span>{label}</span><strong>{value}<small> / {total}</small></strong></div><div className="sa-progress"><i style={{width:(total?Math.min(100,value/total*100):0)+'%'}}/></div></div>;}
function SalesTable({rows,compact,seeAll}:{rows:Sale[];compact?:boolean;seeAll?:()=>void}){return <section className="sa-panel sa-sales-panel"><div className="sa-panel-heading"><div><h2>{compact?'Vendas recentes':'Histórico de vendas dos planos'}</h2><p>Pagamentos confirmados e reversões notificadas pelo Mercado Pago.</p></div>{compact&&seeAll&&<button className="sa-link-button" onClick={seeAll}>Ver histórico <ChevronRight size={15}/></button>}</div><div className="sa-table-wrap"><table className="sa-table"><thead><tr><th>DATA</th><th>BARBEARIA</th><th>PROFISSIONAL</th><th>VALOR</th><th>STATUS</th><th>VÁLIDO ATÉ</th></tr></thead><tbody>{rows.map((s,i)=><tr key={s.payment_at+s.shop_slug+i}><td>{date(s.payment_at)}</td><td><strong>{s.shop_name}</strong><small>/{s.shop_slug}</small></td><td>{s.barber_name}</td><td className="sa-money">{money(s.amount_cents)}</td><td><span className={'sa-status '+(s.approved?'active':'reversed')}>{s.approved?'Aprovado':'Estornado / revertido'}</span></td><td>{s.approved?date(s.period_end):'—'}</td></tr>)}{!rows.length&&<tr><td colSpan={6} className="sa-empty-row"><BadgeDollarSign size={22}/><strong>Nenhuma venda neste período</strong><span>Pagamentos de mensalidade aparecerão aqui após confirmação.</span></td></tr>}</tbody></table></div></section>;}

