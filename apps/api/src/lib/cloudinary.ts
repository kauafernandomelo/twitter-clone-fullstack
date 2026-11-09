import { createHash } from 'node:crypto';

import type { UploadKind, UploadSignature } from '@twitter-clone/shared';

import { env } from '../config/env';
import { logger } from './logger';

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

function getConfig(): CloudinaryConfig | null {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}

export const isCloudinaryConfigured = () => getConfig() !== null;

// Cada usuário só sobe arquivos na própria pasta (separada por ambiente: development/production).
export function userUploadFolder(userId: string, kind: UploadKind) {
  return `twitter-clone/${env.NODE_ENV}/users/${userId}/${kind}`;
}

/**
 * Assinatura de upload do Cloudinary: SHA-1 dos parâmetros ordenados + api_secret.
 * O secret nunca sai do servidor; o navegador só recebe a assinatura, que vale
 * para ESTES parâmetros (pasta + timestamp) e expira em 1 hora.
 * Docs: https://cloudinary.com/documentation/authentication_signatures
 */
export function signUpload(userId: string, kind: UploadKind): UploadSignature | null {
  const config = getConfig();
  if (!config) return null;

  const folder = userUploadFolder(userId, kind);
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    apiKey: config.apiKey,
    timestamp,
    signature: createHash('sha1').update(toSign).digest('hex'),
    folder,
  };
}

/** Confere se a URL é de uma imagem nossa, enviada para a pasta deste usuário. */
export function isOwnUploadUrl(url: string, userId: string, kind: UploadKind) {
  const config = getConfig();
  if (!config) return false;

  const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return false;

  // formato: .../image/upload/v1234567890/<folder>/<public_id>.<ext>
  const path = url.slice(prefix.length).replace(/^v\d+\//, '');
  return path.startsWith(`${userUploadFolder(userId, kind)}/`);
}

/**
 * public_id de uma URL nossa: ".../image/upload/v123/<pasta>/<nome>.jpg" → "<pasta>/<nome>".
 * Só aceita URLs do nosso cloud; qualquer outra devolve null.
 */
export function publicIdFromUrl(url: string) {
  const config = getConfig();
  if (!config) return null;
  const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return null;
  return url
    .slice(prefix.length)
    .replace(/^v\d+\//, '')
    .replace(/\.[a-z0-9]+$/i, '');
}

/**
 * Apaga imagens do Cloudinary (avatar trocado, post apagado...). Roda em segundo plano:
 * se o Cloudinary falhar, a ação da pessoa não falha junto; só registramos no log.
 * Imagens fora do nosso cloud (ou sem Cloudinary configurado) são ignoradas.
 */
export function deleteUploadedImages(urls: (string | null | undefined)[]) {
  const config = getConfig();
  if (!config) return;

  for (const url of urls) {
    const publicId = url ? publicIdFromUrl(url) : null;
    if (!publicId) continue;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`)
      .digest('hex');
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: config.apiKey,
      signature,
    });

    void fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
      method: 'POST',
      body,
    })
      .then(async (res) => {
        if (!res.ok)
          logger.warn({ publicId, status: res.status }, 'Cloudinary: falha ao apagar imagem');
      })
      .catch((error: unknown) =>
        logger.warn({ publicId, error }, 'Cloudinary: falha ao apagar imagem'),
      );
  }
}
