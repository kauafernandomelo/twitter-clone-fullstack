import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { registerAndLogin } from '../test/helpers';
import { publicIdFromUrl, userUploadFolder } from './cloudinary';

const imageUrl = (folder: string, file: string) =>
  `https://res.cloudinary.com/test-cloud/image/upload/v1731160000/${folder}/${file}`;

/** public_ids enviados para o endpoint de destroy do Cloudinary (pelo fetch falso). */
function destroyedIds() {
  const fetchMock = vi.mocked(fetch);
  return fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith('/image/destroy'))
    .map(([, init]) => new URLSearchParams(init?.body as URLSearchParams).get('public_id'));
}

describe('limpeza de imagens no Cloudinary', () => {
  it('extrai o public_id só de URLs do nosso cloud', () => {
    expect(publicIdFromUrl(imageUrl('twitter-clone/test/users/u1/avatar', 'abc.jpg'))).toBe(
      'twitter-clone/test/users/u1/avatar/abc',
    );
    expect(publicIdFromUrl('https://outro-site.com/foto.jpg')).toBeNull();
  });

  it('trocar o avatar apaga o antigo; remover o banner apaga o banner', async () => {
    const { agent, user } = await registerAndLogin();
    const avatar1 = imageUrl(userUploadFolder(user.id, 'avatar'), 'a1.jpg');
    const avatar2 = imageUrl(userUploadFolder(user.id, 'avatar'), 'a2.jpg');
    const banner = imageUrl(userUploadFolder(user.id, 'banner'), 'b1.jpg');

    await agent.patch('/api/users/me').send({ avatarUrl: avatar1, bannerUrl: banner });
    expect(destroyedIds()).toEqual([]);

    await agent.patch('/api/users/me').send({ avatarUrl: avatar2, bannerUrl: null });

    expect(destroyedIds().sort()).toEqual([
      `${userUploadFolder(user.id, 'avatar')}/a1`,
      `${userUploadFolder(user.id, 'banner')}/b1`,
    ]);
  });

  it('editar só o texto do perfil não apaga nada', async () => {
    const { agent, user } = await registerAndLogin();
    await agent
      .patch('/api/users/me')
      .send({ avatarUrl: imageUrl(userUploadFolder(user.id, 'avatar'), 'a.jpg') });

    await agent.patch('/api/users/me').send({ bio: 'nova bio' });

    expect(destroyedIds()).toEqual([]);
  });

  it('apagar um post apaga as imagens dele, com a requisição assinada', async () => {
    const { agent, user } = await registerAndLogin();
    const folder = userUploadFolder(user.id, 'tweet');
    const { body } = await agent.post('/api/tweets').send({
      content: 'com fotos',
      media: [
        { url: imageUrl(folder, 'f1.jpg'), width: 10, height: 10 },
        { url: imageUrl(folder, 'f2.png'), width: 10, height: 10 },
      ],
    });

    await agent.delete(`/api/tweets/${body.tweet.id}`);

    expect(destroyedIds()).toEqual([`${folder}/f1`, `${folder}/f2`]);
    const [, init] = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/image/destroy'))!;
    const params = new URLSearchParams(init?.body as URLSearchParams);
    const expected = createHash('sha1')
      .update(
        `public_id=${params.get('public_id')}&timestamp=${params.get('timestamp')}test-cloudinary-secret`,
      )
      .digest('hex');
    expect(params.get('signature')).toBe(expected);
    expect(params.get('api_key')).toBe('123456789');
  });
});
