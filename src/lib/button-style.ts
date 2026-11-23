import type { ThemeSettings } from '@/types';

export const buttonStyles = [
  { value: 'sharp', label: 'Reto' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'pill', label: 'Cápsula' },
] as const;

export function buttonRadius(style: ThemeSettings['buttonStyle'], rounded = '4px') {
  if (style === 'pill') return '999px';
  if (style === 'sharp') return '0px';
  return rounded;
}
