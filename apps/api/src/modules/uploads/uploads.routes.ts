import { uploadSignatureRequestSchema } from '@twitter-clone/shared';
import { Router } from 'express';

import { AppError } from '../../lib/app-error';
import { signUpload } from '../../lib/cloudinary';
import { uploadRateLimit } from '../../middlewares/rate-limit';
import { getUserId, requireAuth } from '../../middlewares/require-auth';

export const uploadsRouter = Router();

uploadsRouter.post('/signature', requireAuth, uploadRateLimit, (req, res) => {
  const { kind } = uploadSignatureRequestSchema.parse(req.body);
  const signature = signUpload(getUserId(req), kind);

  if (!signature) {
    throw new AppError(
      503,
      'Upload de imagens não está configurado no servidor',
      'SERVICE_UNAVAILABLE',
    );
  }

  res.json(signature);
});
