BEGIN;

CREATE TABLE public.saas_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  name text NOT NULL DEFAULT 'BarberShop Pro',
  price_per_barber_cents integer CHECK (price_per_barber_cents BETWEEN 100 AND 100000000),
  trial_days integer NOT NULL DEFAULT 7 CHECK (trial_days = 7),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.saas_settings(id) VALUES(true);
CREATE TABLE public.platform_admins(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
-- Preserve the sole existing system owner. Never promote future shop owners.
INSERT INTO public.platform_admins SELECT user_id FROM public.user_roles WHERE role='admin' AND active
  AND (SELECT count(*) FROM public.user_roles WHERE role='admin' AND active)=1;
CREATE TABLE public.tenants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid UNIQUE REFERENCES auth.users(id),
 slug text UNIQUE NOT NULL CHECK(slug ~ '^[a-z0-9][a-z0-9-]{2,49}$' AND slug NOT IN ('admin','api','cadastro','super-admin','agendar','confirmacao','login','sistema')),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 120),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','blocked')),
 trial_ends_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.tenants(id,owner_id,slug,name)
SELECT '00000000-0000-4000-8000-000000000001',
 (SELECT user_id FROM public.platform_admins LIMIT 1),'barbershop-pro',
 coalesce((SELECT data->>'barbershopName' FROM public.barbershop_records WHERE kind='siteSettings' AND id='main'),'BarberShop Pro');

ALTER TABLE public.user_roles ADD COLUMN tenant_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.tenants(id);
ALTER TABLE public.barbershop_records ADD COLUMN tenant_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.tenants(id);
ALTER TABLE public.barbershop_records DROP CONSTRAINT barbershop_records_pkey;
ALTER TABLE public.barbershop_records ADD PRIMARY KEY(tenant_id,kind,id);
ALTER TABLE public.booking_receipts ADD COLUMN tenant_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000001' REFERENCES public.tenants(id);

CREATE TABLE public.barber_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES public.tenants(id),
 barber_id text NOT NULL,
 amount_cents integer CHECK(amount_cents BETWEEN 100 AND 100000000),
 provider_id text UNIQUE,
 checkout_url text,
 state text NOT NULL DEFAULT 'new' CHECK(state IN ('new','creating','pending','authorized','paused','cancelled','review')),
 paid_until timestamptz,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,barber_id)
);
CREATE TABLE public.subscription_payments (
 provider_payment_id text PRIMARY KEY,
 subscription_id uuid NOT NULL REFERENCES public.barber_subscriptions(id),
 approved boolean NOT NULL,
 amount_cents integer NOT NULL,
 period_end timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.barber_subscriptions(tenant_id,barber_id)
 SELECT tenant_id,id FROM public.barbershop_records WHERE kind='barbers';

CREATE FUNCTION public.is_platform_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.platform_admins WHERE user_id=auth.uid())
$$;
CREATE FUNCTION public.tenant_staff(tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND tenant_id=tid AND active)
$$;
CREATE FUNCTION public.tenant_admin(tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND tenant_id=tid AND active AND role='admin')
$$;
CREATE FUNCTION public.barber_can_book(tid uuid,bid text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.tenants t WHERE t.id=tid AND t.status='active'
 AND (now()<t.trial_ends_at OR EXISTS(SELECT 1 FROM public.barber_subscriptions s WHERE s.tenant_id=tid AND s.barber_id=bid AND s.paid_until>now())))
$$;
CREATE FUNCTION public.track_barber_subscription() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.kind='barbers' AND EXISTS(SELECT 1 FROM public.barber_subscriptions WHERE tenant_id=OLD.tenant_id AND barber_id=OLD.id AND provider_id IS NOT NULL AND state<>'cancelled') THEN
   RAISE EXCEPTION 'Cancele a assinatura deste barbeiro na tela Mensalidade antes de excluir o cadastro.';
  END IF;
  IF OLD.kind='barbers' THEN UPDATE public.barber_subscriptions SET archived_at=now() WHERE tenant_id=OLD.tenant_id AND barber_id=OLD.id; END IF;
  RETURN OLD;
 END IF;
 IF NEW.kind='barbers' AND EXISTS(SELECT 1 FROM public.barber_subscriptions WHERE tenant_id=NEW.tenant_id AND barber_id=NEW.id AND archived_at IS NOT NULL) THEN RAISE EXCEPTION 'Use um novo identificador para cadastrar este barbeiro.'; END IF;
 IF NEW.kind='barbers' THEN INSERT INTO public.barber_subscriptions(tenant_id,barber_id) VALUES(NEW.tenant_id,NEW.id) ON CONFLICT DO NOTHING; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER track_barber_subscription AFTER INSERT ON public.barbershop_records FOR EACH ROW EXECUTE FUNCTION public.track_barber_subscription();
CREATE TRIGGER protect_barber_subscription BEFORE DELETE ON public.barbershop_records FOR EACH ROW EXECUTE FUNCTION public.track_barber_subscription();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.saas_settings FOR SELECT USING(true);
CREATE POLICY settings_write ON public.saas_settings FOR UPDATE TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE POLICY platform_self ON public.platform_admins FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY tenant_read ON public.tenants FOR SELECT TO authenticated USING(public.tenant_staff(id) OR public.is_platform_admin());
CREATE POLICY tenant_control ON public.tenants FOR UPDATE TO authenticated USING(public.is_platform_admin()) WITH CHECK(public.is_platform_admin());
CREATE POLICY subscription_read ON public.barber_subscriptions FOR SELECT TO authenticated USING(public.tenant_admin(tenant_id) OR public.is_platform_admin());
CREATE POLICY payment_read ON public.subscription_payments FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.barber_subscriptions s WHERE s.id=subscription_id AND (public.tenant_admin(s.tenant_id) OR public.is_platform_admin())));
DROP POLICY read_roles ON public.user_roles;
CREATE POLICY read_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.tenant_admin(tenant_id));
DROP POLICY staff_read ON public.barbershop_records;
DROP POLICY staff_write ON public.barbershop_records;
DROP POLICY public_catalog ON public.barbershop_records;
CREATE POLICY staff_read ON public.barbershop_records FOR SELECT TO authenticated USING(public.tenant_staff(tenant_id));
CREATE POLICY staff_insert ON public.barbershop_records FOR INSERT TO authenticated WITH CHECK(public.tenant_staff(tenant_id) AND (kind IN ('clients','appointments') OR public.tenant_admin(tenant_id)));
CREATE POLICY staff_update ON public.barbershop_records FOR UPDATE TO authenticated USING(public.tenant_staff(tenant_id) AND (kind IN ('clients','appointments') OR public.tenant_admin(tenant_id))) WITH CHECK(public.tenant_staff(tenant_id) AND (kind IN ('clients','appointments') OR public.tenant_admin(tenant_id)));
CREATE POLICY staff_delete ON public.barbershop_records FOR DELETE TO authenticated USING(public.tenant_staff(tenant_id) AND (kind IN ('clients','appointments') OR public.tenant_admin(tenant_id)));
CREATE POLICY public_catalog ON public.barbershop_records FOR SELECT USING(
 kind IN ('services','barbers','testimonials','gallery','holidays','siteSettings','themeSettings')
 AND EXISTS(SELECT 1 FROM public.tenants t WHERE t.id=tenant_id AND t.status='active')
 AND (kind NOT IN ('services','barbers','testimonials') OR data->>'active'='true'));
-- Public catalog policy must not depend on a tenant table hidden behind RLS.
CREATE FUNCTION public.tenant_is_public(tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.tenants WHERE id=tid AND status='active') $$;
DROP POLICY public_catalog ON public.barbershop_records;
CREATE POLICY public_catalog ON public.barbershop_records FOR SELECT USING(
 kind IN ('services','barbers','testimonials','gallery','holidays','siteSettings','themeSettings')
 AND public.tenant_is_public(tenant_id) AND (kind NOT IN ('services','barbers','testimonials') OR data->>'active'='true'));

CREATE FUNCTION public.public_shop(shop_slug text DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('id',id,'slug',slug,'name',name) FROM public.tenants WHERE status='active' AND
 ((shop_slug IS NULL AND id='00000000-0000-4000-8000-000000000001') OR slug=shop_slug)
$$;
CREATE FUNCTION public.shop_booking_access(tid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'allowed',public.barber_can_book(tid,r.id))),'[]'::jsonb)
 FROM public.barbershop_records r WHERE tenant_id=tid AND kind='barbers' AND data->>'active'='true'
$$;
CREATE FUNCTION public.create_shop(shop_name text,shop_slug text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; source_settings jsonb; source_theme jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para criar a barbearia.'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid()) THEN RAISE EXCEPTION 'Esta conta já pertence a uma barbearia.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Confirme seu e-mail antes de continuar.'; END IF;
 INSERT INTO public.tenants(owner_id,slug,name) VALUES(auth.uid(),lower(trim(shop_slug)),trim(shop_name)) RETURNING id INTO tid;
 INSERT INTO public.user_roles(user_id,role,active,tenant_id) VALUES(auth.uid(),'admin',true,tid);
 SELECT data INTO source_settings FROM public.barbershop_records WHERE tenant_id='00000000-0000-4000-8000-000000000001' AND kind='siteSettings' AND id='main';
 SELECT data INTO source_theme FROM public.barbershop_records WHERE tenant_id='00000000-0000-4000-8000-000000000001' AND kind='themeSettings' AND id='main';
 -- Copy only layout settings, never another shop's customers, staff or contact details.
 source_settings:=coalesce(source_settings,'{}') || jsonb_build_object('barbershopName',trim(shop_name),'phone','','whatsapp','','email','','address','','city','','state','','cnpj','','logo','','favicon','','socialMedia',jsonb_build_object('instagram','','facebook','','tiktok','','youtube',''));
 INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES(tid,'siteSettings','main',source_settings),(tid,'themeSettings','main',coalesce(source_theme,'{}'));
 RETURN tid;
END $$;

CREATE FUNCTION public.claim_barber_checkout(bid text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; sub public.barber_subscriptions; amount integer; can_create boolean:=false;
BEGIN
 SELECT tenant_id INTO tid FROM public.user_roles WHERE user_id=auth.uid() AND active AND role='admin';
 IF tid IS NULL OR NOT EXISTS(SELECT 1 FROM public.barbershop_records WHERE tenant_id=tid AND kind='barbers' AND id=bid) THEN RAISE EXCEPTION 'Barbeiro não encontrado.'; END IF;
 IF NOT public.tenant_is_public(tid) THEN RAISE EXCEPTION 'Barbearia bloqueada.'; END IF;
 SELECT * INTO sub FROM public.barber_subscriptions WHERE tenant_id=tid AND barber_id=bid FOR UPDATE;
 SELECT price_per_barber_cents INTO amount FROM public.saas_settings WHERE id=true;
 IF amount IS NULL THEN RAISE EXCEPTION 'O administrador da plataforma ainda não definiu o valor.'; END IF;
 IF sub.state='cancelled' THEN RAISE EXCEPTION 'Assinatura cancelada. Entre em contato com a plataforma para reativar este cadastro.'; END IF;
 IF sub.state='new' THEN
  UPDATE public.barber_subscriptions SET state='creating',amount_cents=amount WHERE id=sub.id RETURNING * INTO sub; can_create:=true;
 END IF;
 RETURN to_jsonb(sub)||jsonb_build_object('can_create',can_create);
END $$;

REVOKE ALL ON public.platform_admins,public.tenants,public.saas_settings,public.barber_subscriptions,public.subscription_payments FROM anon,authenticated;
GRANT SELECT ON public.saas_settings TO anon,authenticated;
GRANT SELECT ON public.tenants,public.platform_admins,public.barber_subscriptions,public.subscription_payments TO authenticated;
GRANT UPDATE(price_per_barber_cents,name,updated_at) ON public.saas_settings TO authenticated;
GRANT UPDATE(status) ON public.tenants TO authenticated;
REVOKE ALL ON FUNCTION public.track_barber_subscription() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_shop(text,text),public.claim_barber_checkout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_shop(text,text),public.claim_barber_checkout(text) TO authenticated;
COMMIT;
