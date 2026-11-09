// Contratos compartilhados entre front e back (schemas Zod + tipos inferidos).
export * from './auth';
export * from './errors';
export * from './search';
export * from './text';
export * from './tweets';
export * from './uploads';
export * from './users';

export type HealthResponse = {
  status: 'ok';
  uptime: number;
  timestamp: string;
};
