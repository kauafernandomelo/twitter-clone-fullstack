import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../app';
import { userUploadFolder } from '../../lib/cloudinary';
import { registerAndLogin } from '../../test/helpers';

const app = createApp();

function cloudinaryUrl(folder: string, file = 'abc123.jpg') {
  return `https://res.cloudinary.com/test-cloud/image/upload/v1731160000/${folder}/${file}`;
}

describe('GET /api/users/:username', () => {
  it('exige login', async () => {
    const res = await request(app).get('/api/users/ana_souza');
    expect(res.status).toBe(401);
  });

  it('devolve o perfil público (sem email nem senha), ignorando maiúsculas', async () => {
    const { agent } = await registerAndLogin();

    const res = await agent.get('/api/users/Ana_Souza');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Ana Souza',
      username: 'ana_souza',
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
    });
    expect(res.body.user).not.toHaveProperty('email');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('responde 404 para conta inexistente', async () => {
    const { agent } = await registerAndLogin();
    const res = await agent.get('/api/users/ninguem_aqui');
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Esta conta não existe');
  });
});

describe('PATCH /api/users/me', () => {
  it('atualiza só os campos enviados', async () => {
    const { agent } = await registerAndLogin();

    const res = await agent
      .patch('/api/users/me')
      .send({ bio: '  Dev em formação  ', location: 'São Paulo', website: 'meusite.dev' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Ana Souza',
      bio: 'Dev em formação',
      location: 'São Paulo',
      website: 'https://meusite.dev',
    });
  });

  it('string vazia apaga o campo', async () => {
    const { agent } = await registerAndLogin();
    await agent.patch('/api/users/me').send({ bio: 'algo', website: 'https://a.com' });

    const res = await agent.patch('/api/users/me').send({ bio: '', website: '' });

    expect(res.body.user.bio).toBeNull();
    expect(res.body.user.website).toBeNull();
  });

  it('valida tamanhos e links', async () => {
    const { agent } = await registerAndLogin();

    const res = await agent
      .patch('/api/users/me')
      .send({ name: '', bio: 'x'.repeat(161), website: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['name', 'bio', 'website']),
    );
  });

  it('aceita avatar e banner enviados para a pasta do próprio usuário', async () => {
    const { agent, user } = await registerAndLogin();
    const avatarUrl = cloudinaryUrl(userUploadFolder(user.id, 'avatar'));
    const bannerUrl = cloudinaryUrl(userUploadFolder(user.id, 'banner'));

    const res = await agent.patch('/api/users/me').send({ avatarUrl, bannerUrl });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ avatarUrl, bannerUrl });
    // a sessão também enxerga o avatar novo (usado na sidebar)
    expect((await agent.get('/api/auth/me')).body.user.avatarUrl).toBe(avatarUrl);
  });

  it('recusa imagens de fora ou da pasta de outro usuário', async () => {
    const { agent } = await registerAndLogin();
    const other = await registerAndLogin({ username: 'outro_user', email: 'outro@example.com' });

    const res = await agent.patch('/api/users/me').send({
      avatarUrl: 'https://imagens-aleatorias.com/foto.jpg',
      bannerUrl: cloudinaryUrl(userUploadFolder(other.user.id, 'banner')),
    });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual({
      avatarUrl: ['Imagem inválida'],
      bannerUrl: ['Imagem inválida'],
    });
  });

  it('permite remover o banner', async () => {
    const { agent, user } = await registerAndLogin();
    await agent
      .patch('/api/users/me')
      .send({ bannerUrl: cloudinaryUrl(userUploadFolder(user.id, 'banner')) });

    const res = await agent.patch('/api/users/me').send({ bannerUrl: null });

    expect(res.body.user.bannerUrl).toBeNull();
  });
});
