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
    winByTwo: boolean;
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

export default function Matches() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Read filter from URL on component mount
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
  }, [status, router, filter]);

  async function fetchMatches() {
    try {
      const response = await fetch(`/api/matches?filter=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      let fetchedMatches = data.matches || [];

      // Sort past matches to show matches with scores first
      if (filter === 'past') {
        fetchedMatches.sort((a: Match, b: Match) => {
          const aHasScores = a.games && a.games.length > 0;
          const bHasScores = b.games && b.games.length > 0;

          // First sort by whether they have scores (scores first)
          if (aHasScores && !bHasScores) return -1;
          if (!aHasScores && bHasScores) return 1;

          // Then sort by date (most recent first)
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
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white' }}>Loading matches...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <nav style={{ display: 'flex' }}>
                <ol style={{
                  display: 'flex',
                  alignItems: 'center',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  <li style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/dashboard" style={{
                      color: '#6b7280',
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}>
                      Dashboard
                    </Link>
                    <span style={{
                      margin: '0 0.5rem',
                      color: '#9ca3af'
                    }}>/</span>
                  </li>
                  <li>
                    <span style={{
                      color: '#111827',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>Matches</span>
                  </li>
                </ol>
              </nav>
              <h1 style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif'
              }}>My Matches</h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={() => setFilter('upcoming')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: filter === 'upcoming' ? 'white' : '#374151',
              backgroundColor: filter === 'upcoming' ? '#1f2937' : 'white',
              border: filter === 'upcoming' ? '1px solid #1f2937' : '1px solid #d1d5db',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (filter !== 'upcoming') {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              } else {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
            onMouseOut={(e) => {
              if (filter !== 'upcoming') {
                e.currentTarget.style.backgroundColor = 'white';
              } else {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: filter === 'past' ? 'white' : '#374151',
              backgroundColor: filter === 'past' ? '#1f2937' : 'white',
              border: filter === 'past' ? '1px solid #1f2937' : '1px solid #d1d5db',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (filter !== 'past') {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              } else {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
            onMouseOut={(e) => {
              if (filter !== 'past') {
                e.currentTarget.style.backgroundColor = 'white';
              } else {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            Past Matches
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: filter === 'all' ? 'white' : '#374151',
              backgroundColor: filter === 'all' ? '#1f2937' : 'white',
              border: filter === 'all' ? '1px solid #1f2937' : '1px solid #d1d5db',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              } else {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
            onMouseOut={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.backgroundColor = 'white';
              } else {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            All Matches
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280' }}>No matches found.</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}>
              {matches.map((match, index) => {
                const { date, time } = formatDateTime(match.scheduledTime);
                const status = getMatchStatus(match);
                // Allow score entry for any scheduled match (regardless of time)
                // since matches can be rescheduled or played at different times
                const needsScoreEntry =
                  match.status === 'SCHEDULED' &&
                  (!match.games || match.games.length === 0);

                const statusColors: { [key: string]: { bg: string; text: string } } = {
                  'bg-green-100 text-green-800': { bg: '#d1fae5', text: '#065f46' },
                  'bg-red-100 text-red-800': { bg: '#fee2e2', text: '#991b1b' },
                  'bg-yellow-100 text-yellow-800': { bg: '#fef3c7', text: '#92400e' },
                  'bg-orange-100 text-orange-800': { bg: '#fed7aa', text: '#9a3412' },
                  'bg-blue-100 text-blue-800': { bg: '#dbeafe', text: '#1e40af' }
                };

                const currentStatusColor = statusColors[status.color] || { bg: '#f3f4f6', text: '#374151' };

                return (
                  <li key={match.id} style={{
                    borderBottom: index < matches.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <Link
                      href={`/matches/${match.id}`}
                      style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              <p style={{
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#111827'
                              }}>
                                {match.league.name} - {formatGameType(match.league.gameType)}
                              </p>
                              <p style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                marginTop: '0.25rem',
                                color: '#111827',
                                fontFamily: 'var(--font-playfair), Georgia, serif'
                              }}>
                                vs {getOpponentName(match)}
                              </p>
                            </div>
                            <div style={{ marginLeft: '0.5rem', flexShrink: 0 }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.125rem 0.625rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                backgroundColor: currentStatusColor.bg,
                                color: currentStatusColor.text
                              }}>
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '1.5rem',
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>
                              <span>{date}</span>
                              <span>{time}</span>
                              {match.court && <span>{match.court.name}</span>}
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.875rem'
                            }}>
                              {match.games && match.games.length > 0 ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '1rem'
                                }}>
                                  <span style={{
                                    color: '#111827',
                                    fontWeight: '500'
                                  }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginRight: '0.25rem' }}>
                                      (You-Opponent)
                                    </span>
                                    Games: {match.games.map(g => {
                                      // Determine if current user is player1 or player2
                                      const isPlayer1 = match.player1.id === session?.user?.id;
                                      const isPlayer2 = match.player2.id === session?.user?.id;
                                      const isPlayer3 = match.player3?.id === session?.user?.id;

                                      // For cutthroat games with 3 players
                                      if (g.player3Score !== null && g.player3Score !== undefined) {
                                        if (isPlayer1) {
                                          return `${g.player1Score}-${g.player2Score}-${g.player3Score}`;
                                        } else if (isPlayer2) {
                                          return `${g.player2Score}-${g.player1Score}-${g.player3Score}`;
                                        } else if (isPlayer3) {
                                          return `${g.player3Score}-${g.player1Score}-${g.player2Score}`;
                                        }
                                        return `${g.player1Score}-${g.player2Score}-${g.player3Score}`;
                                      }

                                      // For regular 2-player games
                                      if (isPlayer1) {
                                        return `${g.player1Score}-${g.player2Score}`;
                                      } else if (isPlayer2) {
                                        return `${g.player2Score}-${g.player1Score}`;
                                      }
                                      return `${g.player1Score}-${g.player2Score}`;
                                    }).join(', ')}
                                  </span>
                                  {(!match.player1Confirmed || !match.player2Confirmed) && (
                                    <Link
                                      href={`/matches/${match.id}/confirm`}
                                      style={{
                                        color: '#d97706',
                                        fontWeight: '500',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.color = '#92400e';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.color = '#d97706';
                                      }}
                                    >
                                      Confirm Score
                                    </Link>
                                  )}
                                </div>
                              ) : needsScoreEntry ? (
                                <Link
                                  href={`/matches/${match.id}/report`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '0.25rem 0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'white',
                                    backgroundColor: '#1f2937',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#111827';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1f2937';
                                  }}
                                >
                                  Report Score
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}