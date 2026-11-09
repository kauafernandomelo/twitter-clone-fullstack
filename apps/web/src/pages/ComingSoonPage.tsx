import { PageHeader } from '@/components/layout/PageHeader';

type ComingSoonPageProps = { title: string; description: string };

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-8 py-16 text-center">
        <p className="text-[31px] leading-9 font-extrabold">Em breve</p>
        <p className="mt-2 text-[15px] text-muted">{description}</p>
      </div>
    </>
  );
}
