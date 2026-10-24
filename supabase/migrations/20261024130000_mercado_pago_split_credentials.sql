BEGIN;

-- The Subscriptions integration and the Orders API application can use separate
-- Mercado Pago credentials, so one application cannot accidentally replace the other.
DROP FUNCTION IF EXISTS public.platform_save_mercado_pago_config(text,text,text,text);

CREATE OR REPLACE FUNCTION public.platform_save_mercado_pago_config(
 p_access_token text DEFAULT NULL,
 p_webhook_secret text DEFAULT NULL,
 p_public_key text DEFAULT NULL,
 p_app_url text DEFAULT NULL,
 p_orders_access_token text DEFAULT NULL,
 p_orders_webhook_secret text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE secret_id uuid; normalized_url text;
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso restrito ao superadministrador.'; END IF;
 IF coalesce(length(trim(p_access_token)),0)>512 OR coalesce(length(trim(p_webhook_secret)),0)>512 OR coalesce(length(trim(p_public_key)),0)>256 OR coalesce(length(trim(p_orders_access_token)),0)>512 OR coalesce(length(trim(p_orders_webhook_secret)),0)>512 THEN
  RAISE EXCEPTION 'Uma credencial excede o tamanho permitido.';
 END IF;
 IF nullif(trim(p_app_url),'') IS NOT NULL THEN
  normalized_url:=regexp_replace(trim(p_app_url),'/+$','');
  IF length(normalized_url)>255 OR normalized_url !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?$' THEN
   RAISE EXCEPTION 'Informe a URL HTTPS principal do site, sem caminho adicional.';
  END IF;
  p_app_url:=normalized_url;
 END IF;

 IF nullif(trim(p_access_token),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_access_token' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_access_token),'mp_access_token','Access Token da aplicação Mercado Pago Assinaturas');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_access_token),'mp_access_token','Access Token da aplicação Mercado Pago Assinaturas'); END IF;
 END IF;
 IF nullif(trim(p_webhook_secret),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_webhook_secret' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_webhook_secret),'mp_webhook_secret','Segredo de webhook da aplicação Mercado Pago Assinaturas');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_webhook_secret),'mp_webhook_secret','Segredo de webhook da aplicação Mercado Pago Assinaturas'); END IF;
 END IF;
 IF nullif(trim(p_public_key),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_public_key' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_public_key),'mp_public_key','Public Key da aplicação Mercado Pago Assinaturas');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_public_key),'mp_public_key','Public Key da aplicação Mercado Pago Assinaturas'); END IF;
 END IF;
 IF nullif(trim(p_app_url),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_app_url' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_app_url),'mp_app_url','URL HTTPS publicada do SaaS');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_app_url),'mp_app_url','URL HTTPS publicada do SaaS'); END IF;
 END IF;
 IF nullif(trim(p_orders_access_token),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_orders_access_token' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_orders_access_token),'mp_orders_access_token','Access Token da aplicação Checkout Transparente');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_orders_access_token),'mp_orders_access_token','Access Token da aplicação Checkout Transparente'); END IF;
 END IF;
 IF nullif(trim(p_orders_webhook_secret),'') IS NOT NULL THEN
  SELECT id INTO secret_id FROM vault.secrets WHERE name='mp_orders_webhook_secret' LIMIT 1;
  IF secret_id IS NULL THEN PERFORM vault.create_secret(trim(p_orders_webhook_secret),'mp_orders_webhook_secret','Segredo de webhook da aplicação Checkout Transparente');
  ELSE PERFORM vault.update_secret(secret_id,trim(p_orders_webhook_secret),'mp_orders_webhook_secret','Segredo de webhook da aplicação Checkout Transparente'); END IF;
 END IF;
 RETURN public.platform_mercado_pago_config_status();
END $$;

CREATE OR REPLACE FUNCTION public.platform_mercado_pago_config_status()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'Acesso restrito ao superadministrador.'; END IF;
 RETURN jsonb_build_object(
  'accessTokenConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_access_token'),
  'webhookSecretConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_webhook_secret'),
  'publicKeyConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_public_key'),
  'appUrlConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_app_url'),
  'ordersAccessTokenConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_orders_access_token'),
  'ordersWebhookSecretConfigured',EXISTS(SELECT 1 FROM vault.secrets WHERE name='mp_orders_webhook_secret')
 );
END $$;

CREATE OR REPLACE FUNCTION public.platform_mercado_pago_config_private()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT jsonb_build_object(
  'accessToken',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_access_token' LIMIT 1),
  'webhookSecret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_webhook_secret' LIMIT 1),
  'publicKey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_public_key' LIMIT 1),
  'appUrl',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_app_url' LIMIT 1),
  'ordersAccessToken',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_orders_access_token' LIMIT 1),
  'ordersWebhookSecret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='mp_orders_webhook_secret' LIMIT 1)
 )
$$;

REVOKE ALL ON FUNCTION public.platform_save_mercado_pago_config(text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.platform_save_mercado_pago_config(text,text,text,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.platform_mercado_pago_config_status() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.platform_mercado_pago_config_status() TO authenticated;
REVOKE ALL ON FUNCTION public.platform_mercado_pago_config_private() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.platform_mercado_pago_config_private() TO service_role;

COMMIT;
