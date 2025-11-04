'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  email: string;
}

interface Court {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
  gameType: string;
}

interface Game {
  id: string;
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
  player4Score?: number;
}

interface Match {
  id: string;
  scheduledTime: string;
  weekNumber: number;
  status: string;
  league: League;
  player1: Player;
  player2: Player;
  player3?: Player;
  player4?: Player;
  court?: Court;
  games: Game[];
}

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchCompletedMatches = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'COMPLETED');
      if (selectedLeague !== 'all') {
        params.append('leagueId', selectedLeague);
      }

      const response = await fetch(`/api/matches?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = (await response.json()) as { matches?: Match[] };
      setMatches(data.matches || []);

      // Extract unique leagues from matches
      const uniqueLeagues = new Map<string, League>();
      data.matches?.forEach((match) => {
        if (!uniqueLeagues.has(match.league.id)) {
          uniqueLeagues.set(match.league.id, match.league);
        }
      });
      setLeagues(Array.from(uniqueLeagues.values()));
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLeague, session]);

  useEffect(() => {
    if (session) {
      void fetchCompletedMatches();
    }
  }, [fetchCompletedMatches, session]);

  const formatGameType = (gameType: string): string => {
    switch (gameType) {
      case 'SINGLES': return 'Singles';
      case 'DOUBLES': return 'Doubles';
      case 'CUTTHROAT': return 'Cut-Throat';
      default: return gameType;
    }
  };

  const calculateMatchWinner = (match: Match) => {
    if (!match.games || match.games.length === 0) return null;

    let player1Wins = 0;
    let player2Wins = 0;
    let player3Wins = 0;

    match.games.forEach(game => {
      const scores = [
        { player: 'player1', name: match.player1.name, score: game.player1Score },
        { player: 'player2', name: match.player2.name, score: game.player2Score }
      ];

      if (match.league.gameType === 'CUTTHROAT' && game.player3Score !== undefined && match.player3) {
        scores.push({ player: 'player3', name: match.player3.name, score: game.player3Score });
      }

      const winner = scores.reduce((prev, current) =>
        current.score > prev.score ? current : prev
      );

      if (winner.player === 'player1') player1Wins++;
      else if (winner.player === 'player2') player2Wins++;
      else if (winner.player === 'player3') player3Wins++;
    });

    if (match.league.gameType === 'CUTTHROAT') {
      if (player1Wins >= 2) return match.player1.name;
      if (player2Wins >= 2) return match.player2.name;
      if (player3Wins >= 2 && match.player3) return match.player3.name;
    } else {
      if (player1Wins >= 2) return match.player1.name;
      if (player2Wins >= 2) return match.player2.name;
    }

    return null;
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
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
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Match Results</h1>
          <p style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>View completed matches and scores</p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Filter by League */}
        {leagues.length > 0 && (
          <div style={{
            marginBottom: '1.5rem'
          }}>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '200px'
              }}
            >
              <option value="all">All Leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Results List */}
        {matches.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280' }}>No completed matches found.</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {matches.map((match) => {
              const winner = calculateMatchWinner(match);

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  style={{
                    display: 'block',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>
                        {match.league.name} - {formatGameType(match.league.gameType)}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {new Date(match.scheduledTime).toLocaleDateString()} • Week {match.weekNumber}
                      </p>
                    </div>
                    {winner && (
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        Winner: {winner}
                      </div>
                    )}
                  </div>

                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        {match.player1.name} vs {match.player2.name}
                        {match.player3 && (
                          <span>
                            {match.league.gameType === 'CUTTHROAT'
                              ? ` vs ${match.player3.name}`
                              : match.player4
                                ? ` • ${match.player3.name} & ${match.player4.name}`
                                : ''
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {match.games.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '0.5rem'
                      }}>
                        {match.games.map((game) => (
                          <div
                            key={game.id}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#f9fafb',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              Game {game.gameNumber}
                            </div>
                            <div style={{ fontWeight: '500', color: '#111827' }}>
                              {game.player1Score}-{game.player2Score}
                              {match.league.gameType === 'CUTTHROAT' && game.player3Score !== undefined && (
                                <span>-{game.player3Score}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
