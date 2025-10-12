import MatchesClient from './MatchesClient';

export const dynamic = 'force-dynamic';

type MatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const resolvedParams = await searchParams;
  const filterParam = resolvedParams?.filter;

  const initialFilter =
    filterParam === 'past' || filterParam === 'all' || filterParam === 'upcoming'
      ? filterParam
      : 'upcoming';

  return <MatchesClient initialFilter={initialFilter} />;
}
