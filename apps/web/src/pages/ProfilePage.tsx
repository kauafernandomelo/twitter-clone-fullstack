import { useParams } from 'react-router';

import { PageHeader } from '@/components/layout/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useCurrentUser } from '@/features/auth/api';
import { useProfile } from '@/features/users/api';
import { ProfileHeader } from '@/features/users/components/ProfileHeader';
import { ProfileTabs } from '@/features/users/components/ProfileTabs';
import { ApiError } from '@/lib/api';

export function ProfilePage() {
  const { username = '' } = useParams();
  const currentUser = useCurrentUser();
  const { data: profile, isPending, error } = useProfile(username);

  if (isPending) {
    return (
      <>
        <PageHeader title="Perfil" showBack />
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      </>
    );
  }

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <>
        <PageHeader title="Perfil" showBack />
        <div className="aspect-[3/1] bg-surface" />
        <div className="px-4 pt-3">
          <div className="-mt-[15%] aspect-square w-1/4 min-w-12 rounded-full border-4 border-background bg-surface" />
          <p className="mt-3 text-xl font-extrabold">@{username}</p>
        </div>
        <div className="px-8 py-10 text-center">
          <p className="text-[31px] leading-9 font-extrabold">
            {notFound ? 'Esta conta não existe' : 'Algo deu errado'}
          </p>
          <p className="mt-2 text-[15px] text-muted">
            {notFound ? 'Tente fazer outra busca.' : 'Tente recarregar a página.'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={profile.name} subtitle="0 posts" showBack />
      <ProfileHeader profile={profile} isOwnProfile={profile.id === currentUser.id} />
      <ProfileTabs username={profile.username} />
    </>
  );
}
