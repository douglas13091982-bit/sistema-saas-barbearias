export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export async function preparePhoto(file: File): Promise<string> {
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
    const ratio = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a foto neste navegador.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/webp', 0.82);
    if (!result.startsWith('data:image/') || result.length > 700000) {
      throw new Error('A foto ficou muito grande. Escolha uma imagem menor.');
    }
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
