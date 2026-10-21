export function getServiceImage(name: string, category = ''): string {
  const text = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const key = /sobrancelha/.test(text) ? 'sobrancelha'
    : /pele|facial/.test(text) ? 'pele'
    : /hidrat|capilar/.test(text) ? 'hidratacao'
    : /corte.*barba|barba.*corte|combo/.test(text) ? 'combo'
    : /degrade|fade/.test(text) ? 'degrade'
    : /navalh/.test(text) ? 'navalhado'
    : /barba/.test(text) ? 'barba'
    : /tratamento/i.test(category) ? 'hidratacao' : 'corte';
  return '/images/servico-' + key + '.webp';
}
