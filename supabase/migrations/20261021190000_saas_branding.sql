BEGIN;
ALTER TABLE public.saas_settings ADD COLUMN logo text NOT NULL DEFAULT '' CHECK (logo='' OR (length(logo)<=260000 AND logo ~ '^data:image/webp;base64,[A-Za-z0-9+/=]+$'));
ALTER TABLE public.saas_settings ADD CONSTRAINT saas_name_length CHECK(length(trim(name)) BETWEEN 2 AND 120);
GRANT UPDATE(logo) ON public.saas_settings TO authenticated;
COMMIT;
