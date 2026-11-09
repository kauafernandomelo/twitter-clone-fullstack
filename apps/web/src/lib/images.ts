import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '@twitter-clone/shared';

export type PixelArea = { x: number; y: number; width: number; height: number };

/** Mensagem de erro se o arquivo não puder ser usado; null se estiver ok. */
export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }
  if (file.size > MAX_UPLOAD_BYTES) return 'A imagem pode ter no máximo 5 MB.';
  return null;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem'));
    image.src = src;
  });
}

/**
 * Recorta a área escolhida no cropper e já redimensiona para o tamanho final.
 * Fazer isso no navegador reduz o upload (uma foto de 4 MB vira ~100 KB).
 */
export async function cropImage(
  src: string,
  area: PixelArea,
  output: { width: number; height: number },
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível');

  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    output.width,
    output.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))),
      'image/jpeg',
      0.9,
    );
  });
}
