import { createHash } from 'node:crypto';

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { registerAndLogin } from '../../test/helpers';

describe('POST /api/uploads/signature', () => {
  it('exige login', async () => {
    const res = await request(createApp()).post('/api/uploads/signature').send({ kind: 'avatar' });
    expect(res.status).toBe(401);
  });

  it('assina o upload na pasta do usuário, sem expor o secret', async () => {
    const { agent, user } = await registerAndLogin();

    const res = await agent.post('/api/uploads/signature').send({ kind: 'avatar' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      uploadUrl: 'https://api.cloudinary.com/v1_1/test-cloud/image/upload',
      apiKey: '123456789',
      folder: `twitter-clone/test/users/${user.id}/avatar`,
    });
    const expected = createHash('sha1')
      .update(`folder=${res.body.folder}&timestamp=${res.body.timestamp}test-cloudinary-secret`)
      .digest('hex');
    expect(res.body.signature).toBe(expected);
    expect(JSON.stringify(res.body)).not.toContain('test-cloudinary-secret');
  });

  it('valida o tipo de upload', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.post('/api/uploads/signature').send({ kind: 'video' });
    expect(res.status).toBe(400);
  });
});
