'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  pointsToWin: number;
  numberOfGames: number;
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

export default function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState<string>('');
  const isMobile = useIsMobile();

  useEffect(() => {
    params.then(p => setMatchId(p.matchId));
  }, [params]);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setMatch(data.match);
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const formatGameType = (gameType: string): string => {
    switch (gameType) {
      case 'SINGLES': return 'Singles';
      case 'DOUBLES': return 'Doubles';
      case 'CUTTHROAT': return 'Cut-Throat';
      default: return gameType;
    }
  };

  const formatStatus = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const calculateMatchWinner = () => {
    if (!match || match.games.length === 0) return null;

    let player1Wins = 0;
    let player2Wins = 0;
    let player3Wins = 0;

    match.games.forEach(game => {
      const scores = [
        { player: 'player1', score: game.player1Score },
        { player: 'player2', score: game.player2Score }
      ];

      if (match.league.gameType === 'CUTTHROAT' && game.player3Score !== undefined) {
        scores.push({ player: 'player3', score: game.player3Score });
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

  const canReportScore = () => {
    if (!session || !match) return false;
    const userId = session.user.id;
    return (
      match.status === 'SCHEDULED' &&
      (match.player1.id === userId ||
       match.player2.id === userId ||
       match.player3?.id === userId ||
       match.player4?.id === userId)
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>Loading match details...</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>{error || 'Match not found'}</div>
      </div>
    );
  }

  const winner = calculateMatchWinner();

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: isMobile ? '1.5rem 0.75rem 2.5rem' : '2rem 1rem'
      }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <Link
            href="/matches"
            style={{
              color: '#9ca3af',
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            ← Back to Matches
          </Link>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'var(--font-playfair), Georgia, serif',
            marginBottom: '0.5rem'
          }}>
            Match Details
          </h1>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '1rem' }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: `${getStatusColor(match.status)}20`,
              color: getStatusColor(match.status),
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {formatStatus(match.status)}
            </span>
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              {match.league.name} • Week {match.weekNumber}
            </span>
          </div>
        </div>

        {/* Match Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: isMobile ? '1.25rem' : '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Match Information
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Players
              </div>
              <div style={{ fontSize: '1rem', color: '#111827', fontWeight: '500' }}>
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

            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Date & Time
              </div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                {new Date(match.scheduledTime).toLocaleDateString()} at{' '}
                {new Date(match.scheduledTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Court
              </div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                {match.court?.name || 'TBD'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Game Type
              </div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                {formatGameType(match.league.gameType)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Game Rules
              </div>
              <div style={{ fontSize: '1rem', color: '#111827' }}>
                Best of {match.league.numberOfGames} · First to {match.league.pointsToWin} points
              </div>
            </div>
          </div>
        </div>

        {/* Scores Section */}
        {match.games.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Game Scores
            </h2>

            {winner && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.375rem',
                border: '1px solid #86efac'
              }}>
                <span style={{ color: '#166534', fontWeight: '600' }}>
                  Winner: {winner}
                </span>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                      Game
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                      {match.player1.name}
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                      {match.player2.name}
                    </th>
                    {match.league.gameType === 'CUTTHROAT' && match.player3 && (
                      <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
                        {match.player3.name}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {match.games.map((game) => {
                    const gameWinner = match.league.gameType === 'CUTTHROAT'
                      ? Math.max(game.player1Score, game.player2Score, game.player3Score || 0)
                      : Math.max(game.player1Score, game.player2Score);

                    return (
                      <tr key={game.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                          Game {game.gameNumber}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontWeight: game.player1Score === gameWinner ? '600' : '400',
                          color: game.player1Score === gameWinner ? '#059669' : '#6b7280'
                        }}>
                          {game.player1Score}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          fontWeight: game.player2Score === gameWinner ? '600' : '400',
                          color: game.player2Score === gameWinner ? '#059669' : '#6b7280'
                        }}>
                          {game.player2Score}
                        </td>
                        {match.league.gameType === 'CUTTHROAT' && (
                          <td style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontWeight: game.player3Score === gameWinner ? '600' : '400',
                            color: game.player3Score === gameWinner ? '#059669' : '#6b7280'
                          }}>
                            {game.player3Score || 0}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canReportScore() && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem'
          }}>
            <Link
              href={`/matches/${match.id}/report`}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'inline-block'
              }}
            >
              Report Score
            </Link>
          </div>
        )}

        {match.status === 'SCHEDULED' && !canReportScore() && (
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            Only match participants can report scores
          </div>
        )}
      </div>
    </div>
  );
}
