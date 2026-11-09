import type { HealthResponse } from '@twitter-clone/shared';
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
