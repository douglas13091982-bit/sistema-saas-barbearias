-- Manual, non-billing access for individual barber calendars.
ALTER TABLE public.barber_subscriptions
  ADD COLUMN IF NOT EXISTS manual_access boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.platform_set_barber_manual_access(subscription_id uuid, enabled boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Apenas o superadministrador pode liberar agendas manualmente.';
  END IF;
  UPDATE public.barber_subscriptions
     SET manual_access = enabled
   WHERE id = subscription_id AND archived_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barbeiro não encontrado ou arquivado.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.platform_set_barber_manual_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.platform_set_barber_manual_access(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.barber_can_book(tid uuid,bid text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
 SELECT EXISTS(
   SELECT 1 FROM public.tenants t
   WHERE t.id=tid AND t.status='active'
     AND (now()<t.trial_ends_at OR EXISTS(
       SELECT 1 FROM public.barber_subscriptions s
       WHERE s.tenant_id=tid AND s.barber_id=bid AND s.archived_at IS NULL
         AND (s.manual_access OR s.paid_until>now())
     ))
 )
$$;
