import type { AuthUser, UserProfile } from '@twitter-clone/shared';

export const authUser: AuthUser = {
  id: 'user-1',
  name: 'Ana Souza',
  username: 'ana_souza',
  email: 'ana@example.com',
  avatarUrl: null,
  createdAt: '2026-11-09T12:00:00.000Z',
};

export const ownProfile: UserProfile = {
  id: 'user-1',
  name: 'Ana Souza',
  username: 'ana_souza',
  bio: 'Dev em formação',
  location: 'São Paulo',
  website: 'https://ana.dev',
  avatarUrl: null,
  bannerUrl: null,
  createdAt: '2026-11-09T12:00:00.000Z',
};

export const otherProfile: UserProfile = {
  ...ownProfile,
  id: 'user-2',
  name: 'Bruno Lima',
  username: 'bruno',
  bio: null,
  location: null,
  website: null,
};
