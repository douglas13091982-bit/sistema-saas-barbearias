export type SubscriptionLinkResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Valida o link de assinatura que a barbearia cola no cadastro do serviço.
 * Vazio é permitido (sem assinatura). Só aceita https, para o cliente nunca ser levado a uma página sem criptografia.
 */
export function normalizeSubscriptionUrl(raw: unknown): SubscriptionLinkResult {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return { ok: true, url: '' };
  if (value.length > 500) return { ok: false, error: 'O link é muito longo (máximo de 500 caracteres).' };
  if (/\s/.test(value)) return { ok: false, error: 'O link não pode ter espaços. Copie e cole novamente.' };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  // "pagamento.exemplo.com/plano" vira https://...; qualquer outro protocolo (javascript:, data:, http:) é recusado.
  if (hasScheme && !/^https:\/\//i.test(value)) return { ok: false, error: 'O link precisa começar com https://' };
  let parsed: URL;
  try { parsed = new URL(hasScheme ? value : `https://${value}`); }
  catch { return { ok: false, error: 'Link inválido. Cole o endereço completo do seu plano de assinatura.' }; }
  if (parsed.protocol !== 'https:') return { ok: false, error: 'O link precisa começar com https://' };
  if (parsed.username || parsed.password) return { ok: false, error: 'O link não pode conter usuário ou senha.' };
  if (!parsed.hostname.includes('.')) return { ok: false, error: 'Link inválido. Cole o endereço completo do seu plano de assinatura.' };
  return { ok: true, url: parsed.href };
}

/** Para exibição pública: devolve o link só se ele for válido; qualquer dado estranho no cadastro é ignorado. */
export function safeSubscriptionUrl(value: unknown): string | null {
  const result = normalizeSubscriptionUrl(value);
  return result.ok && result.url ? result.url : null;
}
