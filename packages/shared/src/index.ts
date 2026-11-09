// Contratos compartilhados entre front e back (schemas Zod + tipos inferidos).
// Cada feature ganha seu arquivo aqui a partir da Fase 1 (ex.: auth.ts).

export type HealthResponse = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};
