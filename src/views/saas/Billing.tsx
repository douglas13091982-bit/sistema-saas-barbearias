import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, Check, Clock, Copy, CreditCard, FileText, Loader2, Lock, QrCode, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { billingAction } from '@/lib/billing.functions';
import { formatCep, formatCpf, isValidCpf, onlyDigits } from '@/lib/cpf';
import '@/styles/saas.css';

type CardFormInstance = { getCardFormData: () => { token?: string }; unmount?: () => void };
declare global {
  interface Window { MercadoPago?: new (key: string, options?: { locale: string }) => { cardForm: (options: Record<string, unknown>) => CardFormInstance } }
}

let mercadoScript: Promise<void> | undefined;
function loadMercadoPago() {
  if (window.MercadoPago) return Promise.resolve();
  if (!mercadoScript) mercadoScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-mercado-pago-sdk]');
    const script = existing || document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2'; script.async = true; script.dataset['mercadoPagoSdk'] = 'true';
    script.onload = () => resolve();
    script.onerror = () => { mercadoScript = undefined; script.remove(); reject(new Error('Não foi possível carregar o formulário seguro do Mercado Pago. Verifique sua conexão ou desative bloqueadores de anúncios para este site.')); };
    if (!existing) document.head.appendChild(script);
  });
  return mercadoScript;
}

type Method = 'card' | 'pix' | 'boleto';
type Step = 'method' | 'details' | 'card' | 'order' | 'done';
type Target = { barberId: string; barberName: string; amountCents: number };
type Prepared = { barberId: string; barberName: string; amountCents: number; payerEmail: string; trialEndsAt: string | null; publicKey: string };
type OrderPayment = { ticketUrl?: string | null; qrCode?: string | null; qrCodeBase64?: string | null; barcodeContent?: string | null; digitableLine?: string | null };
type TransparentOrder = { barberId: string; method: 'pix' | 'boleto'; amountCents: number; orderId: string; expiresAt: string; payment: OrderPayment };
type Payer = { firstName: string; lastName: string; cpf: string; zipCode: string; street: string; number: string; neighborhood: string; city: string; state: string };

const emptyPayer: Payer = { firstName: '', lastName: '', cpf: '', zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '' };
const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const countdown = (ms: number) => {
  const total = Math.floor(ms / 1000), hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60;
  return `${hours ? `${hours}h ` : ''}${String(minutes).padStart(2, '0')}min ${String(seconds).padStart(2, '0')}s`;
};
const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export default function Billing() {
  const { tenant, barbers, bookingAccess, refresh, currentUser } = useData();
  const action = useServerFn(billingAction);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<any[]>([]);
  const [ordersStoreReady, setOrdersStoreReady] = useState(false);
  const [ordersLoadError, setOrdersLoadError] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [transparentReady, setTransparentReady] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [target, setTarget] = useState<Target | null>(null);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method | ''>('');
  const [payer, setPayer] = useState<Payer>(emptyPayer);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Payer, string>>>({});
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [order, setOrder] = useState<TransparentOrder | null>(null);
  const [doneMessage, setDoneMessage] = useState('');
  const [copied, setCopied] = useState('');
  const [cepBusy, setCepBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [rows, settings, status] = await Promise.all([
      supabase.from('barber_subscriptions').select('*').eq('tenant_id', tenant.id),
      supabase.from('saas_settings').select('price_per_barber_cents').eq('id', true).single(),
      action({ data: { action: 'status' } }),
    ]);
    if (rows.error || settings.error) throw new Error('Não foi possível carregar as mensalidades.');
    setSubscriptions(rows.data || []); setPrice(settings.data?.price_per_barber_cents ?? null);
    setCardReady(!!status.cardReady); setTransparentReady(!!status.transparentReady); setReady(!!status.cardReady || !!status.transparentReady);
    setOrdersLoadError(''); setOrdersStoreReady(false);
    const ids = (rows.data || []).map((s: any) => s.id);
    const orders = ids.length ? await supabase.from('subscription_payment_orders').select('id,subscription_id,payment_method,state,provider_order_id,expires_at,created_at,amount_cents').in('subscription_id', ids).order('created_at', { ascending: false }) : { data: [], error: null };
    if (orders.error) { setPaymentOrders([]); setOrdersLoadError(orders.error.message || 'A tabela de cobranças não está disponível.'); return; }
    setPaymentOrders(orders.data || []); setOrdersStoreReady(true);
  }, [tenant?.id, action]);

  useEffect(() => { if (currentUser?.role === 'admin') void load().catch(e => setError(e.message)); }, [load, currentUser?.role]);
  const refreshBilling = useCallback(async () => { setError(''); try { await load(); } catch (e) { setError(messageOf(e, 'Não foi possível atualizar as mensalidades.')); } }, [load]);
  useEffect(() => {
    const refreshOnReturn = () => { if (document.visibilityState === 'visible') void refreshBilling(); };
    window.addEventListener('focus', refreshOnReturn); document.addEventListener('visibilitychange', refreshOnReturn);
    return () => { window.removeEventListener('focus', refreshOnReturn); document.removeEventListener('visibilitychange', refreshOnReturn); };
  }, [refreshBilling]);

  const closeCheckout = useCallback(() => {
    setTarget(null); setStep('method'); setMethod(''); setPrepared(null); setOrder(null); setFieldErrors({}); setError('');
    void refreshBilling();
  }, [refreshBilling]);

  // Lock page scroll and allow Esc while the checkout is open.
  useEffect(() => {
    if (!target) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) { event.preventDefault(); closeCheckout(); } };
    document.body.style.overflow = 'hidden'; window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [target, busy, closeCheckout]);

  // Countdown for the Pix code.
  useEffect(() => {
    if (step !== 'order') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Automatic confirmation: while a Pix/boleto is on screen, ask the server (which consults Mercado Pago) every few seconds.
  const pollRef = useRef<() => Promise<void>>(async () => {});
  pollRef.current = async () => {
    if (!order || document.visibilityState !== 'visible') return;
    try {
      const result: any = await action({ data: { action: 'sync', barberId: order.barberId } });
      if (result?.paid || result?.state === 'approved') { setDoneMessage('Pagamento confirmado! A agenda deste barbeiro já está liberada.'); setStep('done'); await refresh(); await load(); }
      else if (['rejected', 'cancelled', 'expired'].includes(result?.state)) { setError('Esta cobrança expirou ou foi cancelada. Volte e gere uma nova.'); }
    } catch { /* A transient failure never interrupts the checkout; the next tick or the manual button retries. */ }
  };
  useEffect(() => {
    if (step !== 'order' || !order) return;
    const timer = setInterval(() => void pollRef.current(), 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, order?.orderId]);

  const run = async (type: 'checkout' | 'sync' | 'cancel', id: string) => {
    if (busy) return;
    if (type === 'cancel' && !confirm('Cancelar as próximas cobranças deste barbeiro? A agenda permanece liberada apenas até o fim do período já pago.')) return;
    setBusy(id); setError(''); setNotice('');
    try {
      const result: any = await action({ data: { action: type, barberId: id } });
      if (result.legacyUrl) { window.location.assign(result.legacyUrl); return; }
      if (result.authorized) setNotice('Assinatura autorizada pelo Mercado Pago. A agenda só será liberada após a confirmação de um pagamento aprovado.');
      else if (type === 'sync') setNotice(result.paid ? 'Pagamento confirmado. A agenda está liberada.' : 'Consulta concluída. O estado da agenda depende da confirmação do pagamento.');
      await refresh(); await load();
    } catch (e) { setError(messageOf(e, 'Não foi possível concluir.')); }
    finally { setBusy(''); }
  };

  const reactivateAndPay = async (t: Target) => {
    if (busy) return;
    setBusy(t.barberId); setError(''); setNotice('');
    try {
      await action({ data: { action: 'reactivate', barberId: t.barberId } });
      await refresh(); await load();
      setBusy(''); openCheckout(t);
    } catch (e) { setError(messageOf(e, 'Não foi possível reativar este barbeiro.')); }
    finally { setBusy(''); }
  };

  const openCheckout = (t: Target, pending?: { payment_method: 'pix' | 'boleto' }) => {
    setError(''); setNotice(''); setFieldErrors({}); setPrepared(null); setOrder(null); setTarget(t);
    if (pending) { setMethod(pending.payment_method); setStep('order'); void createOrder(t, pending.payment_method); }
    else { setMethod(''); setStep('method'); }
  };

  const chooseCard = async () => {
    if (!target || busy) return;
    setBusy('card'); setError(''); setMethod('card');
    try {
      const result: any = await action({ data: { action: 'prepare', barberId: target.barberId } });
      if (result.legacyUrl) { window.location.assign(result.legacyUrl); return; }
      if (result.authorized) { setDoneMessage('Assinatura autorizada pelo Mercado Pago. A agenda será liberada assim que o primeiro pagamento for aprovado.'); setStep('done'); await refresh(); await load(); return; }
      if (!result.prepared) throw new Error('Não foi possível preparar o pagamento com cartão.');
      setPrepared({ barberId: target.barberId, barberName: result.barberName || target.barberName, amountCents: result.amountCents, payerEmail: result.payerEmail, trialEndsAt: result.trialEndsAt, publicKey: result.publicKey });
      setStep('card');
    } catch (e) { setError(messageOf(e, 'Não foi possível preparar o pagamento com cartão.')); }
    finally { setBusy(''); }
  };

  const submitToken = async (cardToken: string) => {
    if (!prepared || busy) return;
    setBusy('card'); setError('');
    try {
      const result: any = await action({ data: { action: 'subscribe', barberId: prepared.barberId, cardToken } });
      if (result.legacyUrl) { window.location.assign(result.legacyUrl); return; }
      setDoneMessage(result.authorized
        ? 'Assinatura autorizada! A agenda será liberada assim que o Mercado Pago confirmar o primeiro pagamento.'
        : 'O Mercado Pago recebeu seu pedido e está confirmando a assinatura. Acompanhe o status nesta página.');
      setPrepared(null); setStep('done'); await refresh(); await load();
    } catch (e) { setError(messageOf(e, 'Não foi possível concluir. Se o resultado ficou indefinido, feche e use “Consultar pagamento” antes de tentar novamente.')); }
    finally { setBusy(''); }
  };

  const createOrder = async (t: Target, chosen: 'pix' | 'boleto', payerData?: Record<string, string>) => {
    setBusy('order'); setError('');
    try {
      const result: any = await action({ data: { action: 'checkout', barberId: t.barberId, paymentMethod: chosen, ...(payerData ? { payer: payerData } : {}) } as any });
      if (result.legacyUrl) { window.location.assign(result.legacyUrl); return; }
      if (result.authorized) { setDoneMessage('Esta assinatura já está autorizada.'); setStep('done'); await refresh(); await load(); return; }
      if (!result.transparent) throw new Error('O Mercado Pago não retornou os dados da cobrança. Consulte o pagamento antes de tentar novamente.');
      setOrder({ barberId: t.barberId, method: chosen, amountCents: result.amountCents, orderId: result.orderId, expiresAt: result.expiresAt, payment: result.payment });
      setStep('order');
    } catch (e) { setError(messageOf(e, 'Não foi possível criar a cobrança.')); if (!payerData) setStep('method'); else setStep('details'); }
    finally { setBusy(''); }
  };

  const lookupCep = async (value: string) => {
    const digits = onlyDigits(value);
    if (digits.length !== 8) return;
    setCepBusy(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (!data.erro) setPayer(v => ({ ...v, street: data.logradouro || v.street, neighborhood: data.bairro || v.neighborhood, city: data.localidade || v.city, state: (data.uf || v.state).toUpperCase() }));
    } catch { /* The address can still be typed manually. */ }
    finally { setCepBusy(false); }
  };

  const submitDetails = (event: FormEvent) => {
    event.preventDefault();
    if (!target || (method !== 'pix' && method !== 'boleto') || busy) return;
    const errors: Partial<Record<keyof Payer, string>> = {};
    if (payer.firstName.trim().length < 2) errors.firstName = 'Informe seu nome.';
    if (payer.lastName.trim().length < 2) errors.lastName = 'Informe seu sobrenome.';
    if (!isValidCpf(payer.cpf)) errors.cpf = 'CPF inválido. Confira os 11 números.';
    if (method === 'boleto') {
      if (onlyDigits(payer.zipCode).length !== 8) errors.zipCode = 'CEP com 8 números.';
      if (!payer.street.trim()) errors.street = 'Informe a rua.';
      if (!payer.number.trim()) errors.number = 'Informe o número.';
      if (!payer.neighborhood.trim()) errors.neighborhood = 'Informe o bairro.';
      if (!payer.city.trim()) errors.city = 'Informe a cidade.';
      if (!/^[A-Za-z]{2}$/.test(payer.state)) errors.state = 'UF com 2 letras.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void createOrder(target, method, {
      firstName: payer.firstName.trim(), lastName: payer.lastName.trim(), cpf: onlyDigits(payer.cpf),
      ...(method === 'boleto' ? { zipCode: onlyDigits(payer.zipCode), street: payer.street.trim(), number: payer.number.trim(), neighborhood: payer.neighborhood.trim(), city: payer.city.trim(), state: payer.state.toUpperCase() } : {}),
    });
  };

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 2500); }
    catch { setError('Não foi possível copiar automaticamente. Selecione o código e copie manualmente.'); }
  };

  const checkNow = async () => {
    if (!order || busy) return;
    setBusy('check'); setError('');
    try {
      const result: any = await action({ data: { action: 'sync', barberId: order.barberId } });
      if (result?.paid || result?.state === 'approved') { setDoneMessage('Pagamento confirmado! A agenda deste barbeiro já está liberada.'); setStep('done'); await refresh(); await load(); }
      else setNotice('Ainda não recebemos a confirmação. Pix costuma confirmar em segundos; boleto pode levar até 2 dias úteis.');
    } catch (e) { setError(messageOf(e, 'Não foi possível consultar o pagamento.')); }
    finally { setBusy(''); }
  };

  if (currentUser?.role !== 'admin') return <p>Acesso restrito ao proprietário.</p>;
  const trial = new Date(tenant.trial_ends_at) > new Date();
  const field = (key: keyof Payer, label: string, props: Record<string, unknown> = {}, className = '') => (
    <label className={`cko-field ${className}`.trim()}>
      <span>{label}</span>
      <input value={payer[key]} aria-invalid={!!fieldErrors[key]} onChange={event => { const value = event.target.value; setPayer(v => ({ ...v, [key]: key === 'cpf' ? formatCpf(value) : key === 'zipCode' ? formatCep(value) : key === 'state' ? value.toUpperCase().replace(/[^A-Z]/g, '') : value })); setFieldErrors(v => ({ ...v, [key]: undefined })); }} {...props} />
      {fieldErrors[key] && <em role="alert">{fieldErrors[key]}</em>}
    </label>
  );

  return <div className="saas-admin">
    <p className="saas-kicker">MENSALIDADE</p><h1>Suas agendas, sob controle.</h1>
    <p>{barbers.length} barbeiro(s) cadastrado(s), incluindo inativos. {price !== null ? 'Valor atual para novas assinaturas: ' + money(price) + ' por barbeiro/mês.' : 'A plataforma ainda não definiu o valor.'}</p>
    <p>{trial ? 'Teste grátis até ' + new Date(tenant.trial_ends_at).toLocaleString('pt-BR') + '. Você pode contratar durante o teste; o período pago começa após o fim do trial.' : 'O período de teste terminou. Regularize as mensalidades para liberar as agendas.'}</p>
    <button type="button" className="saas-button" disabled={!!busy} onClick={() => void refreshBilling()}>{busy ? 'Atualizando...' : 'Atualizar valor e disponibilidade'}</button>
    <p>Cada barbeiro tem sua própria assinatura mensal. Inativar o perfil não cancela a cobrança; use Cancelar assinatura antes de excluir o cadastro.</p>
    {!ready && <p className="saas-notice">A integração aguarda a configuração das credenciais do Mercado Pago pela plataforma. Pagamentos indisponíveis.</p>}
    {ordersLoadError && <p role="alert" className="saas-notice">O banco ainda não liberou o histórico de cobranças Pix/boleto. Aplique a migração 20261024120000_transparent_subscription_payments.sql no banco do MenuBarber. Detalhe: {ordersLoadError}</p>}
    {!target && error && <p role="alert" className="saas-notice">{error}</p>}{!target && notice && <p role="status" className="saas-notice">{notice}</p>}
    <div className="bill-grid">{barbers.map((barber: any) => {
      const sub = subscriptions.find(s => s.barber_id === barber.id);
      const paid = !!sub?.paid_until && new Date(sub.paid_until).getTime() > Date.now();
      const cancelled = sub?.state === 'cancelled';
      const pendingOrder = paymentOrders.find(o => o.subscription_id === sub?.id && ['creating', 'pending'].includes(o.state) && (!o.expires_at || new Date(o.expires_at).getTime() > Date.now()));
      const hasPrice = !!price;
      // Charges already issued or paid keep their amount; anything else follows the platform's current price.
      const contracted = !!sub && (!!sub.paid_until || sub.state === 'authorized');
      const amount = pendingOrder?.amount_cents || (contracted ? sub.amount_cents || price || 0 : price || sub?.amount_cents || 0);
      const legacy = !!sub?.provider_id && !['authorized', 'cancelled'].includes(sub.state);
      const canReactivate = cancelled && !paid;
      const canPay = !!sub && !sub.provider_id && !paid && !cancelled;
      const payTarget: Target = { barberId: barber.id, barberName: barber.name, amountCents: amount };
      const status = cancelled ? { tone: 'bad', label: 'Cancelada' }
        : paid ? { tone: 'ok', label: 'Em dia' }
        : sub?.state === 'authorized' ? { tone: 'ok', label: 'Assinatura ativa' }
        : pendingOrder ? { tone: 'wait', label: 'Aguardando pagamento' }
        : trial ? { tone: 'trial', label: 'Teste grátis' }
        : { tone: 'warn', label: 'Pagamento pendente' };
      const period = sub?.paid_until ? `Pago até ${new Date(sub.paid_until).toLocaleDateString('pt-BR')}` : trial ? `Teste grátis até ${new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')}` : 'Aguardando pagamento';
      const open = !!bookingAccess[barber.id];
      return <article className="bill-card" key={barber.id}>
        <header className="bill-head">
          <span className="bill-avatar" aria-hidden="true">{String(barber.name || '?').trim().charAt(0).toUpperCase()}</span>
          <div className="bill-who"><h2>{barber.name}</h2><small>{barber.active ? 'Perfil ativo' : 'Perfil inativo'}</small></div>
          <span className={`bill-status bill-${status.tone}`}>{status.label}</span>
        </header>
        <p className="bill-price">{amount ? <><strong>{money(amount)}</strong><span> / mês</span></> : <strong>Valor a definir</strong>}</p>
        <ul className="bill-meta">
          <li><i className={`bill-dot ${open ? 'on' : 'off'}`} />{open ? 'Agenda liberada' : 'Agenda bloqueada'}</li>
          <li><i className="bill-dot idle" />{period}</li>
        </ul>
        <div className="bill-actions">
          {canReactivate && <button type="button" className="bill-primary" disabled={!!busy || !hasPrice || !ready} onClick={() => void reactivateAndPay(payTarget)}>{busy === barber.id ? 'Aguarde...' : 'Reativar e pagar mensalidade'}</button>}
          {legacy && <button type="button" className="bill-primary" disabled={!!busy} onClick={() => void run('checkout', barber.id)}>Retomar pagamento pendente</button>}
          {canPay && <button type="button" className="bill-primary" disabled={!!busy || !hasPrice || !ready} onClick={() => openCheckout(payTarget, pendingOrder)}>{pendingOrder ? `Continuar pagamento ${pendingOrder.payment_method === 'pix' ? 'Pix' : 'boleto'}` : 'Pagar mensalidade'}</button>}
          {paid && !cancelled && <p className="bill-ok">Mensalidade em dia. Nada a pagar agora.</p>}
          {(legacy || pendingOrder || (!cancelled && (sub?.state === 'creating' || sub?.state === 'review'))) && <button type="button" className="bill-ghost" disabled={!!busy} onClick={() => void run('sync', barber.id)}>Consultar pagamento</button>}
          {sub?.provider_id && !cancelled && <button type="button" className="bill-ghost bill-danger" disabled={!!busy} onClick={() => void run('cancel', barber.id)}>Cancelar assinatura</button>}
        </div>
        {!hasPrice && !cancelled && <small className="bill-note">O superadministrador ainda precisa definir o valor mensal para habilitar o pagamento.</small>}
        {hasPrice && !ready && !cancelled && <small className="bill-note">Pagamento indisponível: a integração com o Mercado Pago ainda não foi configurada.</small>}
        {pendingOrder?.amount_cents && hasPrice && pendingOrder.amount_cents !== price && <small className="bill-note">Esta cobrança foi gerada por {money(pendingOrder.amount_cents)}, antes da mudança de valor, e segue válida{pendingOrder.expires_at ? ` até ${new Date(pendingOrder.expires_at).toLocaleString('pt-BR')}` : ''}. Depois disso, a próxima usará {money(price)}.</small>}
        {cancelled && paid && <small className="bill-note">Assinatura cancelada. A agenda segue liberada até o fim do período já pago.</small>}
      </article>;
    })}</div>
    {barbers.length === 0 && <p>Cadastre seu primeiro profissional em Barbeiros para começar.</p>}

    {target && <div className="cko-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) closeCheckout(); }}>
      <section className={`cko-dialog${step === 'details' ? ' cko-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cko-title" tabIndex={-1}>
        <header className="cko-header">
          {(step === 'details' || step === 'card') && <button type="button" className="cko-icon" disabled={!!busy} onClick={() => { setError(''); setStep('method'); }} aria-label="Voltar"><ArrowLeft size={18} /></button>}
          <div>
            <p className="cko-kicker"><Lock size={11} /> Pagamento seguro · Mercado Pago</p>
            <h2 id="cko-title">{step === 'done' ? 'Tudo certo' : `Mensalidade de ${target.barberName}`}</h2>
          </div>
          <button type="button" className="cko-icon cko-close" disabled={!!busy} onClick={closeCheckout} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="cko-summary"><span>{step === 'order' && order ? (order.method === 'pix' ? 'Pix' : 'Boleto') : 'Total'}</span><strong>{money(target.amountCents)}<small> / mês</small></strong>{trial && step !== 'done' && <em>Teste grátis de 7 dias</em>}</div>
        {error && <p role="alert" className="cko-alert">{error}</p>}

        {step === 'method' && <>
          <p className="cko-lead">Como você prefere pagar?</p>
          <div className="cko-methods">
            <button type="button" className="cko-method" disabled={!!busy || !cardReady} onClick={() => void chooseCard()}>
              <span className="cko-method-icon">{busy === 'card' ? <Loader2 className="cko-spin" size={22} /> : <CreditCard size={22} />}</span>
              <span className="cko-method-text"><strong>Cartão de crédito</strong><small>Renovação automática todo mês</small></span><span className="cko-badge">Automático</span>
            </button>
            <button type="button" className="cko-method" disabled={!!busy || !transparentReady || !ordersStoreReady} onClick={() => { setMethod('pix'); setStep('details'); }}>
              <span className="cko-method-icon"><QrCode size={22} /></span>
              <span className="cko-method-text"><strong>Pix</strong><small>Aprovação em segundos · nova cobrança a cada mês</small></span>
            </button>
            <button type="button" className="cko-method" disabled={!!busy || !transparentReady || !ordersStoreReady} onClick={() => { setMethod('boleto'); setStep('details'); }}>
              <span className="cko-method-icon"><FileText size={22} /></span>
              <span className="cko-method-text"><strong>Boleto</strong><small>Confirma em até 2 dias úteis · nova cobrança a cada mês</small></span>
            </button>
          </div>
          {!cardReady && <small className="cko-hint">Cartão indisponível: confira as credenciais da aplicação no Super Admin.</small>}
          {!transparentReady && <small className="cko-hint">Pix e boleto indisponíveis: confira o Access Token e o segredo de webhook.</small>}
          {transparentReady && !ordersStoreReady && <small className="cko-hint">Pix e boleto dependem da migração de cobranças aplicada ao banco.</small>}
          <p className="cko-privacy"><ShieldCheck size={14} /> A agenda só é liberada depois que o Mercado Pago confirma o pagamento.</p>
        </>}

        {step === 'details' && (method === 'pix' || method === 'boleto') && <form className="cko-form" onSubmit={submitDetails} noValidate>
          <p className="cko-lead">Dados do pagador para o {method === 'pix' ? 'Pix' : 'boleto'}</p>
          <div className="cko-grid">
            {field('firstName', 'Nome', { autoComplete: 'given-name', maxLength: 80 })}
            {field('lastName', 'Sobrenome', { autoComplete: 'family-name', maxLength: 80 })}
            {field('cpf', 'CPF', { inputMode: 'numeric', autoComplete: 'off', placeholder: '000.000.000-00', maxLength: 14 }, 'cko-span')}
            {method === 'boleto' && <>
              {field('zipCode', cepBusy ? 'CEP (buscando...)' : 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '00000-000', maxLength: 9, onBlur: () => void lookupCep(payer.zipCode) })}
              {field('state', 'Estado (UF)', { autoComplete: 'address-level1', maxLength: 2, placeholder: 'SC' })}
              {field('street', 'Rua', { autoComplete: 'address-line1' }, 'cko-span')}
              {field('number', 'Número', { autoComplete: 'off' })}
              {field('neighborhood', 'Bairro', {})}
              {field('city', 'Cidade', { autoComplete: 'address-level2' }, 'cko-span')}
            </>}
          </div>
          <button type="submit" className="cko-primary" disabled={!!busy}>{busy ? <><Loader2 className="cko-spin" size={18} /> Gerando cobrança...</> : `Gerar ${method === 'pix' ? 'Pix' : 'boleto'}`}</button>
          <p className="cko-privacy"><Lock size={14} /> Seus dados são enviados com criptografia e usados apenas para emitir a cobrança.</p>
        </form>}

        {step === 'card' && prepared && <>
          <p className="cko-lead">{prepared.trialEndsAt && new Date(prepared.trialEndsAt) > new Date() ? 'A primeira cobrança acontece após o teste grátis.' : 'Dados do cartão de crédito'}</p>
          <CardCheckout key={prepared.barberId} prepared={prepared} disabled={busy === 'card'} onSubmit={token => void submitToken(token)} />
        </>}

        {step === 'order' && !order && !error && <div className="cko-loading"><Loader2 className="cko-spin" size={28} /><p>Recuperando sua cobrança...</p></div>}
        {step === 'order' && !order && error && <button type="button" className="cko-secondary" onClick={() => { setError(''); setStep('method'); }}>Voltar às formas de pagamento</button>}
        {step === 'order' && order && <div className="cko-order">
          {order.method === 'pix' ? <>
            <p className="cko-lead">Escaneie o QR Code ou use o Pix Copia e Cola.</p>
            {order.payment.qrCodeBase64 ? <img className="cko-qr" alt="QR Code Pix" src={`data:image/png;base64,${order.payment.qrCodeBase64}`} /> : <div className="cko-qr cko-qr-empty"><QrCode size={48} /></div>}
            <p className="cko-timer"><Clock size={14} /> {new Date(order.expiresAt).getTime() > now ? `Expira em ${countdown(new Date(order.expiresAt).getTime() - now)}` : 'Este Pix expirou. Feche e gere um novo.'}</p>
            <div className="cko-code"><input readOnly aria-label="Pix Copia e Cola" value={order.payment.qrCode || ''} onFocus={event => event.currentTarget.select()} /></div>
            <button type="button" className="cko-primary" disabled={!order.payment.qrCode} onClick={() => void copy('pix', order.payment.qrCode || '')}>{copied === 'pix' ? <><Check size={18} /> Código copiado</> : <><Copy size={18} /> Copiar código Pix</>}</button>
            <ol className="cko-steps"><li>Abra o app do seu banco e escolha Pix.</li><li>Cole o código ou escaneie o QR Code.</li><li>Confirme — esta tela atualiza sozinha.</li></ol>
          </> : <>
            <p className="cko-lead">Boleto gerado. Pague em qualquer banco, app ou lotérica.</p>
            {order.payment.digitableLine && <><div className="cko-code"><input readOnly aria-label="Linha digitável" value={order.payment.digitableLine} onFocus={event => event.currentTarget.select()} /></div>
              <button type="button" className="cko-primary" onClick={() => void copy('line', order.payment.digitableLine || '')}>{copied === 'line' ? <><Check size={18} /> Linha digitável copiada</> : <><Copy size={18} /> Copiar linha digitável</>}</button></>}
            {order.payment.ticketUrl && <a className="cko-secondary" href={order.payment.ticketUrl} target="_blank" rel="noreferrer"><FileText size={18} /> Abrir boleto para imprimir</a>}
            <p className="cko-timer"><Clock size={14} /> Vence em até 3 dias. A compensação pode levar até 2 dias úteis.</p>
          </>}
          <div className="cko-waiting" role="status"><Loader2 className="cko-spin" size={16} /> Aguardando confirmação do pagamento...</div>
          {notice && <p role="status" className="cko-hint">{notice}</p>}
          <button type="button" className="cko-secondary" disabled={!!busy} onClick={() => void checkNow()}>{busy === 'check' ? 'Consultando...' : 'Já paguei · verificar agora'}</button>
        </div>}

        {step === 'done' && <div className="cko-done">
          <span className="cko-done-icon"><Check size={34} /></span>
          <p>{doneMessage}</p>
          <button type="button" className="cko-primary" onClick={closeCheckout}>Concluir</button>
        </div>}
      </section>
    </div>}
  </div>;
}

function CardCheckout({ prepared, disabled, onSubmit }: { prepared: Prepared; disabled: boolean; onSubmit: (token: string) => void }) {
  const instance = useRef<CardFormInstance | null>(null), submitRef = useRef(onSubmit);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => { submitRef.current = onSubmit; }, [onSubmit]);
  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    // If the secure fields never mount (blocked script, wrong key, network), say so instead of leaving a blank form.
    const watchdog = setTimeout(() => { if (live) { setLoading(false); setError('Os campos seguros do cartão não carregaram. Verifique sua conexão, desative bloqueadores de anúncios e tente novamente.'); } }, 15000);
    void loadMercadoPago().then(() => {
      if (!live || !window.MercadoPago) return;
      const mp = new window.MercadoPago(prepared.publicKey, { locale: 'pt-BR' });
      instance.current = mp.cardForm({
        amount: (prepared.amountCents / 100).toFixed(2), iframe: true,
        form: {
          id: 'form-checkout',
          cardholderName: { id: 'form-checkout__cardholderName', placeholder: 'Como está no cartão' },
          cardholderEmail: { id: 'form-checkout__cardholderEmail', placeholder: 'E-mail' },
          cardNumber: { id: 'form-checkout__cardNumber', placeholder: '0000 0000 0000 0000' },
          expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
          securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
          identificationType: { id: 'form-checkout__identificationType' },
          identificationNumber: { id: 'form-checkout__identificationNumber', placeholder: 'Somente números' },
          issuer: { id: 'form-checkout__issuer' },
          installments: { id: 'form-checkout__installments' },
        },
        callbacks: {
          onFormMounted: (e?: unknown) => {
            if (!live) return;
            clearTimeout(watchdog);
            if (e) { console.warn('[mercadopago] cardForm mount error', e); setError('Não foi possível abrir os campos do cartão. Confira a chave pública da aplicação no Super Admin.'); }
            setLoading(false);
          },
          onSubmit: (event: Event) => {
            event.preventDefault();
            try {
              const token = instance.current?.getCardFormData().token;
              if (!token) { setError('Confira número, validade, CVV e documento do cartão e tente novamente.'); return; }
              setError(''); submitRef.current(token);
            } catch { setError('Não foi possível validar o cartão. Confira os dados e tente novamente.'); }
          },
          onError: (errors: unknown) => { console.warn('[mercadopago] cardForm error', errors); setError('Confira número, validade, CVV e documento do cartão.'); },
        },
      });
    }).catch(e => { if (live) { clearTimeout(watchdog); setLoading(false); setError(messageOf(e, 'Não foi possível carregar o checkout seguro.')); } });
    return () => { live = false; clearTimeout(watchdog); try { instance.current?.unmount?.(); } catch { /* already gone */ } instance.current = null; };
  }, [prepared.amountCents, prepared.barberId, prepared.publicKey, attempt]);
  return <form id="form-checkout" className="cko-form">
    {loading && <div className="cko-loading cko-loading-inline"><Loader2 className="cko-spin" size={18} /> Carregando campos seguros...</div>}
    <div className="cko-grid">
      <label className="cko-field cko-span"><span>Número do cartão</span><div id="form-checkout__cardNumber" className="cko-mp-field" /></label>
      <label className="cko-field"><span>Validade</span><div id="form-checkout__expirationDate" className="cko-mp-field" /></label>
      <label className="cko-field"><span>CVV</span><div id="form-checkout__securityCode" className="cko-mp-field" /></label>
      <label className="cko-field cko-span"><span>Nome no cartão</span><input id="form-checkout__cardholderName" autoComplete="cc-name" required /></label>
      <label className="cko-field cko-span"><span>E-mail</span><input id="form-checkout__cardholderEmail" type="email" defaultValue={prepared.payerEmail} autoComplete="email" required /></label>
      <label className="cko-field"><span>Documento</span><select id="form-checkout__identificationType" /></label>
      <label className="cko-field"><span>Número</span><input id="form-checkout__identificationNumber" inputMode="numeric" autoComplete="off" required /></label>
      <label className="cko-hidden"><select id="form-checkout__issuer" /></label>
      <label className="cko-hidden"><select id="form-checkout__installments" /></label>
    </div>
    {error && <p role="alert" className="cko-alert">{error}</p>}
    {error && !loading && <button type="button" className="cko-secondary" onClick={() => setAttempt(n => n + 1)}>Recarregar campos do cartão</button>}
    <button id="form-checkout__submit" type="submit" className="cko-primary" disabled={disabled || loading}>{disabled ? <><Loader2 className="cko-spin" size={18} /> Processando...</> : loading ? 'Carregando...' : `Autorizar ${money(prepared.amountCents)} / mês`}</button>
    <p className="cko-privacy"><Lock size={14} /> Os dados do cartão são digitados nos campos seguros do Mercado Pago e não ficam salvos neste sistema.</p>
  </form>;
}
