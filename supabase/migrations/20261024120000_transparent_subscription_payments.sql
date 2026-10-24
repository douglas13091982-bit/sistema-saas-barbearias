BEGIN;

CREATE TABLE public.subscription_payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.barber_subscriptions(id) ON DELETE CASCADE,
  provider_order_id text UNIQUE,
  provider_payment_id text UNIQUE,
  payment_method text NOT NULL CHECK (payment_method IN ('pix','boleto')),
  amount_cents integer NOT NULL CHECK (amount_cents BETWEEN 100 AND 100000000),
  state text NOT NULL DEFAULT 'creating' CHECK (state IN ('creating','pending','approved','rejected','cancelled','expired','review')),
  payment_data jsonb,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
 sid uuid,pid text,is_approved boolean,cents integer,approved_at timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sub public.barber_subscriptions; period_start timestamptz;
BEGIN
 SELECT * INTO sub FROM public.barber_subscriptions WHERE id=sid FOR UPDATE;
 IF NOT FOUND OR cents<>sub.amount_cents THEN RAISE EXCEPTION 'Pagamento incompatível.'; END IF;
 IF approved_at IS NULL OR approved_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Data de pagamento inválida.'; END IF;
 IF EXISTS(SELECT 1 FROM public.subscription_payments WHERE provider_payment_id=pid AND subscription_id<>sid) THEN RAISE EXCEPTION 'Pagamento já vinculado.'; END IF;
 SELECT greatest(approved_at,t.trial_ends_at) INTO period_start FROM public.tenants t WHERE t.id=sub.tenant_id;
 period_start:=coalesce(period_start,approved_at);
 INSERT INTO public.subscription_payments(provider_payment_id,subscription_id,approved,amount_cents,period_end,paid_at)
 VALUES(pid,sub.id,is_approved,cents,period_start+interval '1 month',approved_at)
 ON CONFLICT(provider_payment_id) DO UPDATE SET
  approved=excluded.approved,paid_at=coalesce(public.subscription_payments.paid_at,excluded.paid_at),updated_at=now();
 UPDATE public.barber_subscriptions SET paid_until=(SELECT max(period_end) FROM public.subscription_payments WHERE subscription_id=sid AND approved) WHERE id=sid;
END $$;

ALTER TABLE public.subscription_payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_order_read ON public.subscription_payment_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.barber_subscriptions s
    WHERE s.id=subscription_id AND (public.tenant_admin(s.tenant_id) OR public.is_platform_admin())
  ));
REVOKE ALL ON public.subscription_payment_orders FROM anon,authenticated;
GRANT SELECT ON public.subscription_payment_orders TO authenticated;
GRANT ALL ON public.subscription_payment_orders TO service_role;

CREATE OR REPLACE FUNCTION public.claim_subscription_payment_order(sid uuid, method text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; sub public.barber_subscriptions; pending public.subscription_payment_orders; amount integer;
BEGIN
  IF method NOT IN ('pix','boleto') THEN RAISE EXCEPTION 'Meio de pagamento inválido.'; END IF;
  SELECT tenant_id INTO tid FROM public.user_roles
    WHERE user_id=auth.uid() AND active AND role='admin';
  IF tid IS NULL THEN RAISE EXCEPTION 'Acesso restrito ao proprietário da barbearia.'; END IF;
  SELECT * INTO sub FROM public.barber_subscriptions
    WHERE id=sid AND tenant_id=tid AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Barbeiro não encontrado.'; END IF;
  IF sub.state='cancelled' THEN RAISE EXCEPTION 'Esta assinatura foi cancelada. Entre em contato com o suporte.'; END IF;
  IF sub.provider_id IS NOT NULL THEN RAISE EXCEPTION 'Este barbeiro já possui uma assinatura automática ativa. Cancele-a antes de mudar para Pix ou boleto.'; END IF;
  SELECT price_per_barber_cents INTO amount FROM public.saas_settings WHERE id=true;
  amount:=coalesce(sub.amount_cents,amount);
  IF amount IS NULL THEN RAISE EXCEPTION 'O administrador da plataforma ainda não definiu o valor.'; END IF;
  UPDATE public.barber_subscriptions SET amount_cents=amount,state='creating' WHERE id=sub.id;
  SELECT * INTO pending FROM public.subscription_payment_orders
    WHERE subscription_id=sid AND state IN ('creating','pending')
      AND (expires_at IS NULL OR expires_at>now())
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF pending.payment_method<>method THEN RAISE EXCEPTION 'Já existe uma cobrança pendente. Pague ou aguarde o vencimento antes de escolher outro meio.'; END IF;
    RETURN to_jsonb(pending);
  END IF;
  INSERT INTO public.subscription_payment_orders(subscription_id,payment_method,amount_cents)
    VALUES(sid,method,amount) RETURNING * INTO pending;
  RETURN to_jsonb(pending);
END $$;

REVOKE ALL ON FUNCTION public.claim_subscription_payment_order(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_subscription_payment_order(uuid,text) TO authenticated,service_role;

COMMIT;
