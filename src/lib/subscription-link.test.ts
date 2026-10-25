import { describe, expect, it } from 'vitest';
import { normalizeSubscriptionUrl, safeSubscriptionUrl } from './subscription-link';

describe('link de assinatura do serviço', () => {
  it('aceita vazio e links https, completando o protocolo quando falta', () => {
    expect(normalizeSubscriptionUrl('')).toEqual({ ok: true, url: '' });
    expect(normalizeSubscriptionUrl('   ')).toEqual({ ok: true, url: '' });
    expect(normalizeSubscriptionUrl('https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=abc')).toEqual({ ok: true, url: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=abc' });
    expect(normalizeSubscriptionUrl(' pagamento.exemplo.com/plano ')).toEqual({ ok: true, url: 'https://pagamento.exemplo.com/plano' });
  });
  it('recusa protocolos perigosos, http, credenciais embutidas e texto que não é link', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'http://exemplo.com/plano', 'ftp://exemplo.com', 'https://user:senha@exemplo.com', 'meu plano', 'https://localhost/plano', 'https://' + 'a'.repeat(501) + '.com']) {
      expect(normalizeSubscriptionUrl(bad).ok, bad).toBe(false);
    }
  });
  it('na exibição pública ignora valores inválidos do cadastro', () => {
    expect(safeSubscriptionUrl('https://exemplo.com/plano')).toBe('https://exemplo.com/plano');
    expect(safeSubscriptionUrl('javascript:alert(1)')).toBeNull();
    expect(safeSubscriptionUrl(undefined)).toBeNull();
    expect(safeSubscriptionUrl('')).toBeNull();
  });
});
