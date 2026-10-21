BEGIN;

ALTER TABLE public.subscription_payments ADD COLUMN paid_at timestamptz;
-- Backfill the date for historical rows created before exact payment timestamps were stored.
UPDATE public.subscription_payments
SET paid_at=period_end-interval '1 month'
WHERE paid_at IS NULL;

CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
 sid uuid,pid text,is_approved boolean,cents integer,approved_at timestamptz
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sub public.barber_subscriptions;
BEGIN
 SELECT * INTO sub FROM public.barber_subscriptions WHERE id=sid FOR UPDATE;
 IF NOT FOUND OR cents<>sub.amount_cents THEN RAISE EXCEPTION 'Pagamento incompatível.'; END IF;
 IF approved_at IS NULL OR approved_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Data de pagamento inválida.'; END IF;
 IF EXISTS(SELECT 1 FROM public.subscription_payments WHERE provider_payment_id=pid AND subscription_id<>sid) THEN RAISE EXCEPTION 'Pagamento já vinculado.'; END IF;
 INSERT INTO public.subscription_payments(provider_payment_id,subscription_id,approved,amount_cents,period_end,paid_at)
 VALUES(pid,sid,is_approved,cents,approved_at+interval '1 month',approved_at)
 ON CONFLICT(provider_payment_id) DO UPDATE SET
  approved=excluded.approved,paid_at=coalesce(public.subscription_payments.paid_at,excluded.paid_at),updated_at=now();
 UPDATE public.barber_subscriptions SET paid_until=(SELECT max(period_end) FROM public.subscription_payments WHERE subscription_id=sid AND approved) WHERE id=sid;
END $$;

CREATE FUNCTION public.platform_sales_history(p_since timestamptz DEFAULT NULL,p_until timestamptz DEFAULT NULL)
RETURNS TABLE(payment_at timestamptz,period_end timestamptz,amount_cents integer,approved boolean,updated_at timestamptz,shop_name text,shop_slug text,barber_name text,subscription_state text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso restrito ao superadministrador.'; END IF;
 RETURN QUERY
 SELECT p.paid_at,p.period_end,p.amount_cents,p.approved,p.updated_at,t.name,t.slug,
  coalesce(r.data->>'name','Barbeiro cadastrado'),s.state
 FROM public.subscription_payments p
 JOIN public.barber_subscriptions s ON s.id=p.subscription_id
 JOIN public.tenants t ON t.id=s.tenant_id
 LEFT JOIN public.barbershop_records r ON r.tenant_id=s.tenant_id AND r.kind='barbers' AND r.id=s.barber_id
 WHERE p.paid_at IS NOT NULL
  AND (p_since IS NULL OR p.paid_at>=p_since)
  AND (p_until IS NULL OR p.paid_at<p_until)
 ORDER BY p.paid_at DESC
 LIMIT 1000;
END $$;

REVOKE ALL ON FUNCTION public.platform_sales_history(timestamptz,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.platform_sales_history(timestamptz,timestamptz) TO authenticated,service_role;

COMMIT;