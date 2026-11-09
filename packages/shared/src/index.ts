// Contratos compartilhados entre front e back (schemas Zod + tipos inferidos).
export * from './auth';
export * from './errors';

export type HealthResponse = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};
