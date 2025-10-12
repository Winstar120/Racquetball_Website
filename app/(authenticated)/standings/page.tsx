import StandingsClient from './StandingsClient';

export const dynamic = 'force-dynamic';

type StandingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
  const resolvedParams = await searchParams;
  const leagueParam = resolvedParams?.leagueId;

  const initialLeagueId = Array.isArray(leagueParam)
    ? leagueParam[0] ?? null
    : leagueParam ?? null;

  return <StandingsClient initialLeagueId={initialLeagueId} />;
}
