DROP POLICY IF EXISTS settings_read ON public.saas_settings;
CREATE POLICY settings_read ON public.saas_settings FOR SELECT TO anon, authenticated USING (id = true);