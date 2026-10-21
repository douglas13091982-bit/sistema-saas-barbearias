export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export async function preparePhoto(file: File, options: { maxEdge?: number; maxBytes?: number } = {}): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  }
  if (!file.size || file.size > MAX_PHOTO_SIZE) throw new Error('A foto deve ter até 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) {
      throw new Error('Esta imagem é muito grande. Escolha uma foto com resolução menor.');
    }
    const ratio = Math.min(1, (options.maxEdge || 1200) / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const maxBytes = options.maxBytes || 180 * 1024;
    for (const quality of [0.8, 0.7, 0.6]) {
      const result = canvas.toDataURL('image/webp', quality);
      if (!result.startsWith('data:image/webp;base64,')) {
        throw new Error('Seu navegador não suporta conversão WebP. Atualize o navegador para enviar fotos.');
      }
      const bytes = Math.floor((result.length - 'data:image/webp;base64,'.length) * 3 / 4);
      if (bytes <= maxBytes) return result;
    }
    throw new Error('A foto ficou muito grande. Escolha uma imagem menor.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
