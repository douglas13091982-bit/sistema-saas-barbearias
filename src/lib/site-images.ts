const bundledImages: Record<string, string> = {
  "photo-1585747860019-024e8567e756": "/images/barbearia-capa.webp",
  "photo-1596728325488-58c876d1f9ee": "/images/detalhes.webp",
  "photo-1503951914875-452162b0f3f1": "/images/corte.webp",
  "photo-1599351431202-1e0f0137899a": "/images/barba.webp",
  "photo-1621605815971-fbc98d665033": "/images/ambiente.webp",
  "photo-1622286342621-4bd786c2447c": "/images/detalhes.webp",
  "photo-1507003211169-0a1dd7228f2d": "/images/barbeiro-1.webp",
  "photo-1500648767791-00dcc994a43e": "/images/barbeiro-2.webp",
  "photo-1472099645785-5658abf4ff4e": "/images/barbeiro-3.webp"
};

/** Replace only the original demo URLs; keep the owner's custom images. */
export function resolveSiteImage(src?: string): string {
  const value = src?.trim() || '';
  if (/^\/images\/(ambiente|barba|barbeiro-[123]|corte|detalhes)\.jpg$/.test(value)) return value.replace(/\.jpg$/, '.webp');
  try {
    const url = new URL(value);
    if (url.hostname === 'images.unsplash.com') {
      const replacement = bundledImages[url.pathname.slice(1)];
      if (replacement) return replacement;
    }
  } catch { /* Relative paths and uploaded data URLs remain unchanged. */ }
  return value;
}
