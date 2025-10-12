'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatGameType } from '@/lib/utils';

interface StandingsEntry {
  playerId: string;
  playerName: string;
  matches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesWon: number;
  gamesLost: number;
  pointsFor: number;
}

interface LeagueStandings {
  leagueId: string;
  leagueName: string;
  gameType: string;
  rankingMethod: string;
  divisions: {
    divisionId: string;
    divisionName: string;
    standings: StandingsEntry[];
  }[];
}

type StandingsClientProps = {
  initialLeagueId: string | null;
};

export default function StandingsClient({ initialLeagueId }: StandingsClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leagues, setLeagues] = useState<LeagueStandings[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>(initialLeagueId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStandings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function fetchStandings() {
    try {
      const response = await fetch('/api/standings');
      if (!response.ok) throw new Error('Failed to fetch standings');
      const data = await response.json();
      setLeagues(data.leagues || []);

      const leagueIdFromUrl = searchParams.get('leagueId');

      if (
        leagueIdFromUrl &&
        data.leagues?.some((l: LeagueStandings) => l.leagueId === leagueIdFromUrl)
      ) {
        setSelectedLeague(leagueIdFromUrl);
      } else if (data.leagues && data.leagues.length > 0) {
        setSelectedLeague(data.leagues[0].leagueId);
      }
    } catch (err) {
      setError('Failed to load standings');
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'white' }}>Loading standings...</div>
      </div>
    );
  }

  const currentLeague = leagues.find(l => l.leagueId === selectedLeague);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ padding: '1.5rem 0' }}>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif',
              }}
            >
              League Standings
            </h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {error && (
          <div
            style={{
              marginBottom: '1rem',
              borderRadius: '0.375rem',
              backgroundColor: '#fee2e2',
              padding: '1rem',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}

        {leagues.length === 0 ? (
          <div
            style={{
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderRadius: '0',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#9ca3af' }}>No active leagues with standings available.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="league-select"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                Select League
              </label>
              <select
                id="league-select"
                value={selectedLeague}
                onChange={event => setSelectedLeague(event.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '28rem',
                  borderRadius: '0',
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                }}
              >
                {leagues.map(league => (
                  <option key={league.leagueId} value={league.leagueId}>
                    {league.leagueName} - {formatGameType(league.gameType)}
                  </option>
                ))}
              </select>
            </div>

            {currentLeague && (
              <div style={{ marginTop: '2rem' }}>
                <div
                  style={{
                    backgroundColor: '#dbeafe',
                    border: '1px solid #93c5fd',
                    borderRadius: '0',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flexShrink: 0 }}>
                      <svg
                        style={{ height: '1.25rem', width: '1.25rem', color: '#3b82f6' }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div style={{ marginLeft: '0.75rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                        <strong>Ranking Method:</strong>{' '}
                        {currentLeague.rankingMethod === 'BY_POINTS'
                          ? 'By Total Points Scored - Players are ranked by the total number of points they score across all matches'
                          : 'By Wins - Traditional ranking based on win/loss record'}
                      </p>
                    </div>
                  </div>
                </div>

                {currentLeague.divisions.map(division => (
                  <div
                    key={division.divisionId}
                    style={{
                      backgroundColor: 'white',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      borderRadius: '0',
                      overflow: 'hidden',
                      marginTop: '2rem',
                    }}
                  >
                    <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem 1.5rem' }}>
                      <h2
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '500',
                          color: '#111827',
                        }}
                      >
                        {division.divisionName}
                      </h2>
                    </div>

                    {division.standings.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                        No matches played yet in this division
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Player
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Matches
                              </th>
                              <th
                                className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                                  currentLeague.rankingMethod === 'BY_WINS'
                                    ? 'text-blue-600 font-bold'
                                    : 'text-gray-500'
                                }`}
                              >
                                W-L
                              </th>
                              <th
                                className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                                  currentLeague.rankingMethod === 'BY_WINS'
                                    ? 'text-blue-600 font-bold'
                                    : 'text-gray-500'
                                }`}
                              >
                                Win %
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Games W-L
                              </th>
                              <th
                                className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                                  currentLeague.rankingMethod === 'BY_POINTS'
                                    ? 'text-blue-600 font-bold'
                                    : 'text-gray-500'
                                }`}
                              >
                                Total Points
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {division.standings.map((player, index) => (
                              <tr
                                key={player.playerId}
                                className={player.playerId === session?.user.id ? 'bg-blue-50' : ''}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {player.playerName}
                                  {player.playerId === session?.user.id && (
                                    <span className="ml-2 text-xs text-blue-600">(You)</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                  {player.matches}
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                                    currentLeague.rankingMethod === 'BY_WINS'
                                      ? 'text-blue-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {player.wins} - {player.losses}
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                                    currentLeague.rankingMethod === 'BY_WINS'
                                      ? 'text-blue-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {player.winPercentage.toFixed(3)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                  {player.gamesWon} - {player.gamesLost}
                                </td>
                                <td
                                  className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                                    currentLeague.rankingMethod === 'BY_POINTS'
                                      ? 'text-blue-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {player.pointsFor}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
