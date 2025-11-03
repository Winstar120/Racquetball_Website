'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatGameType } from '@/lib/utils';

interface Match {
  id: string;
  scheduledTime: string;
  status: string;
  league: {
    name: string;
    gameType: string;
    pointsToWin: number;
    numberOfGames: number;
  };
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
  player3?: {
    id: string;
    name: string;
  };
  court?: {
    name: string;
  };
  games?: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    player3Score?: number;
  }>;
  scoreReportedBy?: string;
  player1Confirmed: boolean;
  player2Confirmed: boolean;
}

type MatchesClientProps = {
  initialFilter: 'upcoming' | 'past' | 'all';
};

export default function MatchesClient({ initialFilter }: MatchesClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>(initialFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'past' || filterParam === 'upcoming' || filterParam === 'all') {
      setFilter(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filter]);

  async function fetchMatches() {
    try {
      const response = await fetch(`/api/matches?filter=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      let fetchedMatches = data.matches || [];

      if (filter === 'past') {
        fetchedMatches.sort((a: Match, b: Match) => {
          const aHasScores = a.games && a.games.length > 0;
          const bHasScores = b.games && b.games.length > 0;

          if (aHasScores && !bHasScores) return -1;
          if (!aHasScores && bHasScores) return 1;

          return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
        });
      }

      setMatches(fetchedMatches);
    } catch (err) {
      setError('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const getMatchStatus = (match: Match) => {
    const now = new Date();
    const matchTime = new Date(match.scheduledTime);

    if (match.status === 'COMPLETED') {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    if (match.status === 'CANCELLED') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    }
    if (match.games && match.games.length > 0) {
      if (!match.player1Confirmed || !match.player2Confirmed) {
        return { label: 'Score Pending', color: 'bg-yellow-100 text-yellow-800' };
      }
      return { label: 'Score Confirmed', color: 'bg-green-100 text-green-800' };
    }
    if (now > matchTime) {
      return { label: 'Awaiting Score', color: 'bg-orange-100 text-orange-800' };
    }
    return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
  };

  const getOpponentName = (match: Match) => {
    if (!session?.user) return '';

    if (match.league.gameType === 'CUTTHROAT') {
      const players = [match.player1.name, match.player2.name];
      if (match.player3) players.push(match.player3.name);
      return players.filter(name => name !== session.user.name).join(' vs ');
    }

    if (match.player1.id === session.user.id) {
      return match.player2.name;
    }
    return match.player1.name;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'white' }}>Loading matches...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1.5rem 1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <nav style={{ display: 'flex' }}>
                <ol
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  <li style={{ display: 'flex', alignItems: 'center' }}>
                    <Link
                      href="/dashboard"
                      style={{
                        color: '#6b7280',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                      }}
                    >
                      Dashboard
                    </Link>
                    <span
                      style={{
                        margin: '0 0.5rem',
                        color: '#9ca3af',
                      }}
                    >
                      /
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        color: '#111827',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                      }}
                    >
                      Matches
                    </span>
                  </li>
                </ol>
              </nav>
              <h1
                style={{
                  marginTop: '0.75rem',
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                }}
              >
                My Matches
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}
      >
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

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {(['upcoming', 'past', 'all'] as const).map(option => (
            <button
              key={option}
              onClick={() => {
                setFilter(option);
                const params = new URLSearchParams(searchParams);
                params.set('filter', option);
                router.replace(`/matches?${params.toString()}`);
              }}
              style={{
                padding: '0.5rem 1.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: filter === option ? '#111827' : 'white',
                color: filter === option ? 'white' : '#111827',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: 0,
              }}
            >
              {option === 'upcoming' && 'Upcoming Matches'}
              {option === 'past' && 'Past Matches'}
              {option === 'all' && 'All Matches'}
            </button>
          ))}
        </div>

        {matches.length === 0 ? (
          <div
            style={{
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#6b7280' }}>No matches found for the selected filter.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {matches.map(match => {
              const { date, time } = formatDateTime(match.scheduledTime);
              const opponentName = getOpponentName(match);
              const statusInfo = getMatchStatus(match);

              return (
                <div
                  key={match.id}
                  style={{
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    borderRadius: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                  }}
                >
                  <div
                    style={{
                      padding: '1.25rem',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: '#111827',
                        }}
                      >
                        {date}
                      </h2>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '1rem',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {time}
                    </p>

                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: '#6b7280',
                      }}
                    >
                      {match.league.name} • {formatGameType(match.league.gameType)}
                      {match.court?.name ? ` • ${match.court.name}` : ''}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Opponent
                      </p>
                      <p
                        style={{
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: '#111827',
                        }}
                      >
                        {opponentName || 'TBD'}
                      </p>
                    </div>

                    <div>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Match Format
                      </p>
                      <p
                        style={{
                          fontSize: '0.95rem',
                          color: '#374151',
                        }}
                      >
                        Best of {match.league.numberOfGames} · First to {match.league.pointsToWin}
                      </p>
                    </div>

                    {match.games && match.games.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Reported Scores
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {match.games.map(game => (
                            <span
                              key={game.gameNumber}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.85rem',
                                borderRadius: 9999,
                                backgroundColor: '#f3f4f6',
                              }}
                            >
                              Game {game.gameNumber}:{' '}
                              {match.player1.id === session?.user.id
                                ? `${game.player1Score}-${game.player2Score}`
                                : `${game.player2Score}-${game.player1Score}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      borderTop: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <Link
                      href={`/matches/${match.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.6rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: 'white',
                        backgroundColor: '#111827',
                        textDecoration: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      View Match Details
                    </Link>

                    {status === 'authenticated' && session?.user && (
                      <>
                        {matches && matches.length > 0 && (
                          <>
                            {match.games && match.games.length > 0 ? (
                              <Link
                                href={`/matches/${match.id}/confirm`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.6rem 1rem',
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  color: match.player1Confirmed && match.player2Confirmed ? '#6b7280' : '#111827',
                                  backgroundColor: 'white',
                                  border: '1px solid #d1d5db',
                                  textDecoration: 'none',
                                  pointerEvents:
                                    match.player1Confirmed && match.player2Confirmed ? 'none' : 'auto',
                                }}
                              >
                                {match.player1Confirmed && match.player2Confirmed
                                  ? 'Scores Confirmed'
                                  : 'Confirm Scores'}
                              </Link>
                            ) : (
                              <Link
                                href={`/matches/${match.id}/report`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.6rem 1rem',
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  color: '#111827',
                                  backgroundColor: 'white',
                                  border: '1px solid #d1d5db',
                                  textDecoration: 'none',
                                }}
                              >
                                Report Scores
                              </Link>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
