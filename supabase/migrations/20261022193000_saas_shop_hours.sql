BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_shop_business_hours() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 settings jsonb;
 shop_day jsonb;
 service jsonb;
 appointment_date date;
 appointment_time time;
 opening_time time;
 closing_time time;
 duration_minutes integer;
BEGIN
 IF NEW.kind <> 'appointments' THEN RETURN NEW; END IF;

 -- Status changes do not move the appointment, so they should remain possible
 -- even when the shop later changes its opening hours.
 IF TG_OP='UPDATE'
   AND NEW.data->>'date' IS NOT DISTINCT FROM OLD.data->>'date'
   AND NEW.data->>'time' IS NOT DISTINCT FROM OLD.data->>'time'
   AND NEW.data->>'serviceId' IS NOT DISTINCT FROM OLD.data->>'serviceId' THEN
  RETURN NEW;
 END IF;

 SELECT data INTO settings FROM public.barbershop_records
 WHERE tenant_id=NEW.tenant_id AND kind='siteSettings' AND id='main';
 -- Preserve compatibility for older tenant records that have no shop schedule.
 IF settings IS NULL OR jsonb_typeof(settings->'businessHours') IS DISTINCT FROM 'array' THEN RETURN NEW; END IF;

 appointment_date := (NEW.data->>'date')::date;
 appointment_time := (NEW.data->>'time')::time;
 SELECT hours.entry INTO shop_day
 FROM jsonb_array_elements(settings->'businessHours') AS hours(entry)
 WHERE hours.entry->>'dayOfWeek' = (extract(dow FROM appointment_date)::integer)::text
 LIMIT 1;

 IF shop_day IS NULL OR shop_day->>'active' IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'A barbearia está fechada nesse dia.';
 END IF;

 opening_time := nullif(shop_day->>'start','')::time;
 closing_time := nullif(shop_day->>'end','')::time;
 SELECT data INTO service FROM public.barbershop_records
 WHERE tenant_id=NEW.tenant_id AND kind='services' AND id=NEW.data->>'serviceId';
 duration_minutes := greatest(coalesce((service->>'duration')::integer,30),1);

 IF opening_time IS NULL OR closing_time IS NULL OR appointment_time < opening_time
   OR appointment_date + appointment_time + make_interval(mins=>duration_minutes) > appointment_date + closing_time THEN
  RAISE EXCEPTION 'Horário fora do funcionamento da barbearia.';
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_shop_business_hours ON public.barbershop_records;
CREATE TRIGGER enforce_shop_business_hours
 BEFORE INSERT OR UPDATE OF data ON public.barbershop_records
 FOR EACH ROW WHEN (NEW.kind='appointments')
 EXECUTE FUNCTION public.enforce_shop_business_hours();

COMMIT;
