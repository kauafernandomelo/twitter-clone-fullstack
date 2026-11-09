import type { UploadKind } from '@twitter-clone/shared';

import { env } from '../config/env';
import { signUpload } from '../lib/cloudinary';

export type UploadedImage = { url: string; width: number; height: number };

// Fotos de pessoas: randomuser.me (banco gratuito feito para dados de teste).
export const portraitUrl = (photo: string) => `https://randomuser.me/api/portraits/${photo}.jpg`;
// Demais fotos: Picsum (fotos do Unsplash, uso livre), escolhidas pelo id para combinar com o post.
export const picsumUrl = (id: number, width: number, height: number) =>
  `https://picsum.photos/id/${id}/${width}/${height}.jpg`;

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${label}: ${String(error)}`, { cause: error });
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Baixa a imagem e sobe para o Cloudinary pelo MESMO caminho que o navegador usa
 * (upload assinado na pasta do usuário). Assim as URLs passam pelas mesmas validações do app.
 */
export function uploadImage(sourceUrl: string, userId: string, kind: UploadKind) {
  return withRetry(sourceUrl, async () => {
    const source = await fetch(sourceUrl);
    if (!source.ok) throw new Error(`download ${source.status}`);
    const blob = await source.blob();

    const signature = signUpload(userId, kind);
    if (!signature) throw new Error('Cloudinary não configurado');

    const form = new FormData();
    form.append('file', blob, 'seed.jpg');
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', signature.folder);

    const res = await fetch(signature.uploadUrl, { method: 'POST', body: form });
    const body = (await res.json()) as {
      secure_url?: string;
      width?: number;
      height?: number;
      error?: { message: string };
    };
    if (!res.ok || !body.secure_url || !body.width || !body.height) {
      throw new Error(`upload ${res.status} ${body.error?.message ?? ''}`);
    }
    return { url: body.secure_url, width: body.width, height: body.height };
  });
}

/** Apaga do Cloudinary todas as imagens de uma pasta (usado ao recriar o seed). */
export async function deleteFolderImages(prefix: string) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload?prefix=${encodeURIComponent(prefix)}`;

  // a API apaga até 1000 por chamada e avisa com "partial" quando sobrou algo
  for (let round = 0; round < 10; round++) {
    const res = await fetch(url, { method: 'DELETE', headers: { authorization: `Basic ${auth}` } });
    if (!res.ok) throw new Error(`Cloudinary: falha ao apagar ${prefix} (${res.status})`);
    const body = (await res.json()) as { partial?: boolean };
    if (!body.partial) return;
  }
}

/** Roda as tarefas com no máximo `limit` ao mesmo tempo (sem estourar a rede nem a API). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
