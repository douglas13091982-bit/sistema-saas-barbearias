-- Run after the two SaaS migrations inside BEGIN ... ROLLBACK. No test data persists.
INSERT INTO public.tenants(id,slug,name) VALUES('10000000-0000-4000-8000-000000000002','tenant-test','Test shop');
INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES
 ('10000000-0000-4000-8000-000000000002','clients','private-test','{"name":"private"}'),
 ('10000000-0000-4000-8000-000000000002','barbers','test-barber','{"active":true}');
DO $$
DECLARE tid uuid:='10000000-0000-4000-8000-000000000002'; sid uuid; previous_end timestamptz;
BEGIN
 IF NOT public.barber_can_book(tid,'test-barber') THEN RAISE EXCEPTION 'Trial did not grant access'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.tenants WHERE id=tid AND trial_ends_at=created_at+interval '7 days') THEN RAISE EXCEPTION 'Trial not exactly seven days'; END IF;
 UPDATE public.tenants SET trial_ends_at=now()-interval '1 day' WHERE id=tid;
 IF public.barber_can_book(tid,'test-barber') THEN RAISE EXCEPTION 'Expired trial grants access'; END IF;
 BEGIN
  INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES(tid,'appointments','unpaid-appointment','{"barberId":"test-barber","date":"2026-10-22","time":"10:00"}');
  RAISE EXCEPTION 'Unpaid booking was accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'A agenda%' THEN RAISE; END IF; END;
 UPDATE public.barber_subscriptions SET amount_cents=2000,state='authorized' WHERE tenant_id=tid RETURNING id INTO sid;
 IF public.barber_can_book(tid,'test-barber') THEN RAISE EXCEPTION 'Authorization alone grants access'; END IF;
 PERFORM public.apply_subscription_payment(sid,'test-payment',true,2000,now());
 IF NOT public.barber_can_book(tid,'test-barber') THEN RAISE EXCEPTION 'Approved payment does not unlock'; END IF;
 SELECT paid_until INTO previous_end FROM public.barber_subscriptions WHERE id=sid;
 PERFORM public.apply_subscription_payment(sid,'test-payment',true,2000,now()+interval '1 minute');
 IF (SELECT paid_until FROM public.barber_subscriptions WHERE id=sid)<>previous_end THEN RAISE EXCEPTION 'Replay extended billing'; END IF;
 PERFORM public.apply_subscription_payment(sid,'test-payment',false,2000,now());
 IF public.barber_can_book(tid,'test-barber') THEN RAISE EXCEPTION 'Refund did not revoke entitlement'; END IF;
 BEGIN PERFORM public.apply_subscription_payment(sid,'wrong-price',true,1000,now()); RAISE EXCEPTION 'Wrong price accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Pagamento incompatível.' THEN RAISE; END IF; END;
 IF has_function_privilege('authenticated','public.apply_subscription_payment(uuid,text,boolean,integer,timestamptz)','EXECUTE') THEN RAISE EXCEPTION 'Client can grant paid access'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','e6c14f7e-2ab1-4556-bf91-01cea1496df5',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.barbershop_records WHERE tenant_id='10000000-0000-4000-8000-000000000002' AND kind='clients') THEN RAISE EXCEPTION 'Cross-tenant customer leak'; END IF;
 BEGIN INSERT INTO public.barbershop_records(tenant_id,kind,id,data) VALUES('10000000-0000-4000-8000-000000000002','clients','attacker','{}'); RAISE EXCEPTION 'Cross-tenant write allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.barbershop_records WHERE kind IN ('clients','appointments')) THEN RAISE EXCEPTION 'Anonymous private records leak'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.barbershop_records WHERE tenant_id='10000000-0000-4000-8000-000000000002' AND kind='barbers') THEN RAISE EXCEPTION 'Public catalog unavailable'; END IF;
END $$;
RESET ROLE;
SELECT 'tenant isolation, trial expiry, unpaid booking rejection, payment unlock, replay, refund and permissions passed' AS result;
