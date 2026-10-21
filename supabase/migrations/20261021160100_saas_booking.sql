BEGIN;
CREATE OR REPLACE FUNCTION public.book_appointment(input jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid:=coalesce(nullif(input->>'tenantId',''),'00000000-0000-4000-8000-000000000001')::uuid;
 s jsonb; b jsonb; settings jsonb; wh jsonb; cid text; aid text:=gen_random_uuid()::text; tok uuid:=gen_random_uuid(); cl jsonb; ap jsonb; slot timestamp; duration integer; start_min integer;
BEGIN
 IF coalesce(length(trim(input->>'name')),0) NOT BETWEEN 2 AND 150 OR coalesce(length(regexp_replace(input->>'phone','[^0-9]','','g')),0) NOT BETWEEN 10 AND 15 THEN RAISE EXCEPTION 'Nome ou telefone inválido.'; END IF;
 IF NOT public.barber_can_book(tid,input->>'barberId') THEN RAISE EXCEPTION 'A agenda deste barbeiro não está liberada. Entre em contato com a barbearia.'; END IF;
 SELECT data INTO s FROM public.barbershop_records WHERE tenant_id=tid AND kind='services' AND id=input->>'serviceId' AND data->>'active'='true';
 SELECT data INTO b FROM public.barbershop_records WHERE tenant_id=tid AND kind='barbers' AND id=input->>'barberId' AND data->>'active'='true';
 SELECT data INTO settings FROM public.barbershop_records WHERE tenant_id=tid AND kind='siteSettings' AND id='main';
 IF s IS NULL OR b IS NULL OR NOT coalesce(b->'serviceIds' ? (input->>'serviceId'),false) THEN RAISE EXCEPTION 'Serviço ou barbeiro indisponível.'; END IF;
 IF coalesce(input->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(input->>'time','') !~ '^\d{2}:\d{2}$' THEN RAISE EXCEPTION 'Data ou horário inválido.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(tid::text||':'||(input->>'barberId')),hashtext(input->>'date'));
 slot:=((input->>'date')||' '||(input->>'time'))::timestamp;
 IF slot<(now() AT TIME ZONE 'America/Sao_Paulo')+make_interval(hours=>coalesce((settings->>'minAdvanceHours')::int,2)) OR slot::date>(now() AT TIME ZONE 'America/Sao_Paulo')::date+coalesce((settings->>'maxAdvanceDays')::int,30) THEN RAISE EXCEPTION 'Data fora do período permitido.'; END IF;
 SELECT w INTO wh FROM jsonb_array_elements(b->'workingHours') w WHERE (w->>'dayOfWeek')::int=extract(dow FROM slot)::int AND w->>'active'='true';
 IF wh IS NULL OR b->'daysOff' ? (input->>'date') OR EXISTS(SELECT 1 FROM public.barbershop_records WHERE tenant_id=tid AND kind='holidays' AND data->>'date'=input->>'date' AND data->>'active'='true') THEN RAISE EXCEPTION 'Dia indisponível.'; END IF;
 duration:=(s->>'duration')::int; start_min:=extract(hour FROM slot)::int*60+extract(minute FROM slot)::int;
 IF duration IS NULL OR duration<1 OR (input->>'time')::time<(wh->>'start')::time OR slot+make_interval(mins=>duration)>slot::date+(wh->>'end')::time OR (start_min-(extract(hour FROM (wh->>'start')::time)::int*60+extract(minute FROM (wh->>'start')::time)::int))%greatest(coalesce((settings->>'intervalMinutes')::int,15),1)<>0 THEN RAISE EXCEPTION 'Horário indisponível.'; END IF;
 IF EXISTS(SELECT 1 FROM public.barbershop_records a LEFT JOIN public.barbershop_records svc ON svc.tenant_id=tid AND svc.kind='services' AND svc.id=a.data->>'serviceId' WHERE a.tenant_id=tid AND a.kind='appointments' AND a.data->>'barberId'=input->>'barberId' AND a.data->>'date'=input->>'date' AND a.data->>'status' NOT IN ('cancelled','no_show') AND slot<((a.data->>'date')||' '||(a.data->>'time'))::timestamp+make_interval(mins=>coalesce((svc.data->>'duration')::int,30)) AND slot+make_interval(mins=>duration)>((a.data->>'date')||' '||(a.data->>'time'))::timestamp) THEN RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro.'; END IF;
 SELECT id,data INTO cid,cl FROM public.barbershop_records WHERE tenant_id=tid AND kind='clients' AND regexp_replace(data->>'phone','[^0-9]','','g')=regexp_replace(input->>'phone','[^0-9]','','g') LIMIT 1;
 IF cl->>'blocked'='true' THEN RAISE EXCEPTION 'Entre em contato com a barbearia para agendar.'; END IF;
 IF cid IS NULL THEN
  cid:=gen_random_uuid()::text;cl:=jsonb_build_object('id',cid,'name',left(input->>'name',150),'phone',left(input->>'phone',30),'email',left(coalesce(input->>'email',''),200),'notes','','blocked',false,'totalSpent',0,'totalVisits',0,'createdAt',now());
  INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES(tid,'clients',cid,cl);
 END IF;
 ap:=jsonb_build_object('id',aid,'clientId',cid,'barberId',input->>'barberId','serviceId',input->>'serviceId','date',input->>'date','time',input->>'time','status','pending','notes',left(coalesce(input->>'notes',''),2000),'paymentStatus','pending','paymentMethod','','amountPaid',0,'cancelReason','','createdAt',now());
 INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES(tid,'appointments',aid,ap);
 INSERT INTO public.booking_receipts(token,appointment_id,client_id,tenant_id) VALUES(tok,aid,cid,tid);
 RETURN jsonb_build_object('token',tok);
END $$;
CREATE OR REPLACE FUNCTION public.booking_receipt(receipt_token uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('appointment',a.data,'client',jsonb_build_object('id',c.id,'name',c.data->>'name'),'tenantId',r.tenant_id)
 FROM public.booking_receipts r JOIN public.barbershop_records a ON a.tenant_id=r.tenant_id AND a.kind='appointments' AND a.id=r.appointment_id
 JOIN public.barbershop_records c ON c.tenant_id=r.tenant_id AND c.kind='clients' AND c.id=r.client_id
 WHERE r.token=receipt_token AND r.created_at>now()-interval '90 days'
$$;
CREATE FUNCTION public.busy_slots_for_shop(tid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('barberId',data->>'barberId','serviceId',data->>'serviceId','date',data->>'date','time',data->>'time','status',data->>'status')),'[]'::jsonb)
 FROM public.barbershop_records WHERE tenant_id=tid AND kind='appointments' AND public.tenant_is_public(tid) AND data->>'status' NOT IN ('cancelled','no_show') AND data->>'date'>=to_char(now() AT TIME ZONE 'America/Sao_Paulo','YYYY-MM-DD')
$$;
CREATE OR REPLACE FUNCTION public.busy_slots() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.busy_slots_for_shop('00000000-0000-4000-8000-000000000001') $$;
CREATE FUNCTION public.enforce_booking_entitlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.kind='appointments' AND (TG_OP='INSERT' OR NEW.data->>'barberId' IS DISTINCT FROM OLD.data->>'barberId' OR NEW.data->>'date' IS DISTINCT FROM OLD.data->>'date' OR NEW.data->>'time' IS DISTINCT FROM OLD.data->>'time') AND NOT public.barber_can_book(NEW.tenant_id,NEW.data->>'barberId') THEN RAISE EXCEPTION 'A agenda deste barbeiro não está liberada.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER enforce_booking_entitlement BEFORE INSERT OR UPDATE ON public.barbershop_records FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_entitlement();

CREATE FUNCTION public.apply_subscription_payment(sid uuid,pid text,is_approved boolean,cents integer,approved_at timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sub public.barber_subscriptions;
BEGIN
 SELECT * INTO sub FROM public.barber_subscriptions WHERE id=sid FOR UPDATE;
 IF NOT FOUND OR cents<>sub.amount_cents THEN RAISE EXCEPTION 'Pagamento incompatível.'; END IF;
 IF approved_at IS NULL OR approved_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Data de pagamento inválida.'; END IF;
 IF EXISTS(SELECT 1 FROM public.subscription_payments WHERE provider_payment_id=pid AND subscription_id<>sid) THEN RAISE EXCEPTION 'Pagamento já vinculado.'; END IF;
 INSERT INTO public.subscription_payments(provider_payment_id,subscription_id,approved,amount_cents,period_end) VALUES(pid,sid,is_approved,cents,approved_at+interval '1 month')
 ON CONFLICT(provider_payment_id) DO UPDATE SET approved=excluded.approved,updated_at=now();
 UPDATE public.barber_subscriptions SET paid_until=(SELECT max(period_end) FROM public.subscription_payments WHERE subscription_id=sid AND approved) WHERE id=sid;
END $$;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(uuid,text,boolean,integer,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(uuid,text,boolean,integer,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.enforce_booking_entitlement() FROM PUBLIC;
GRANT ALL ON public.tenants,public.saas_settings,public.platform_admins,public.barber_subscriptions,public.subscription_payments TO service_role;
COMMIT;
