import { z } from 'zod';

export const uploadKindSchema = z.enum(['avatar', 'banner', 'tweet', 'message']);
export type UploadKind = z.infer<typeof uploadKindSchema>;

export const uploadSignatureRequestSchema = z.object({ kind: uploadKindSchema });

// Tudo que o navegador precisa para mandar o arquivo DIRETO pro Cloudinary,
// sem a imagem passar pela nossa API (economiza banda e memória do servidor).
export type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
