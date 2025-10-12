'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatGameType } from '@/lib/utils';

interface Match {
  id: string;
  scheduledTime: string;
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
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
}

export default function ReportScore({ params }: { params: Promise<{ matchId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  // Default to 3 games (standard racquetball match)
  const [games, setGames] = useState<Game[]>([
    { gameNumber: 1, player1Score: 0, player2Score: 0 },
    { gameNumber: 2, player1Score: 0, player2Score: 0 },
    { gameNumber: 3, player1Score: 0, player2Score: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState<string>('');

  useEffect(() => {
    params.then(p => setMatchId(p.matchId));
  }, [params]);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  async function fetchMatch() {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setMatch(data.match);

      // Initialize games for cut-throat (3 games standard)
      if (data.match.league.gameType === 'CUTTHROAT') {
        setGames([
          { gameNumber: 1, player1Score: 0, player2Score: 0, player3Score: 0 },
          { gameNumber: 2, player1Score: 0, player2Score: 0, player3Score: 0 },
          { gameNumber: 3, player1Score: 0, player2Score: 0, player3Score: 0 }
        ]);
      } else {
        // Regular singles/doubles - also 3 games
        setGames([
          { gameNumber: 1, player1Score: 0, player2Score: 0 },
          { gameNumber: 2, player1Score: 0, player2Score: 0 },
          { gameNumber: 3, player1Score: 0, player2Score: 0 }
        ]);
      }
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  }

  // Removed add/remove game functions - fixed at 3 games

  function updateScore(gameIndex: number, player: string, value: string) {
    // Allow empty string for backspace/delete
    const score = value === '' ? 0 : parseInt(value) || 0;

    // Enforce the league's score limit
    const maxScore = match?.league.pointsToWin || 15;
    const finalScore = Math.min(Math.max(0, score), maxScore);

    const updatedGames = [...games];
    if (player === 'player1') {
      updatedGames[gameIndex].player1Score = finalScore;
    } else if (player === 'player2') {
      updatedGames[gameIndex].player2Score = finalScore;
    } else if (player === 'player3') {
      updatedGames[gameIndex].player3Score = finalScore;
    }
    setGames(updatedGames);
  }

  async function submitScores() {
    setIsSaving(true);
    setError('');

    if (!match) {
      setError('Match details not loaded yet.');
      setIsSaving(false);
      return;
    }

    const winningScore = match.league.pointsToWin ?? 11;
    const isCutthroatMatch = match.league.gameType === 'CUTTHROAT';

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const scores = [
        game.player1Score,
        game.player2Score,
        isCutthroatMatch ? game.player3Score : undefined,
      ].filter((score): score is number => typeof score === 'number');

      const playersAtWinningScore = scores.filter((score) => score === winningScore);
      if (playersAtWinningScore.length > 1) {
        window.alert(`Game ${i + 1}: Only one player can have ${winningScore} points.`);
        setIsSaving(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit scores');
      }

      router.push('/matches');
    } catch (err: any) {
      setError(err.message || 'Failed to submit scores');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !match) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '1.125rem' }}>Loading match details...</div>
      </div>
    );
  }

  const isCutthroat = match.league.gameType === 'CUTTHROAT';

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
          <nav style={{ display: 'flex' }} aria-label="Breadcrumb">
            <ol style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <li>
                <Link href="/matches" style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}>
                  Matches
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
                }}>Report Score</span>
              </li>
            </ol>
          </nav>
          <h1 style={{
            marginTop: '0.75rem',
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: '#111827',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>
            Report Match Score
          </h1>
          <p style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.975rem'
          }}>
            Enter the results for each game below. Scores should reflect the final points earned by each player.
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Match Details
            </h2>
            <dl style={{
              display: 'grid',
              gap: '1.25rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              fontSize: '0.95rem'
            }}>
              <div>
                <dt style={{ color: '#6b7280', fontWeight: 500 }}>League</dt>
                <dd style={{ color: '#111827', marginTop: '0.25rem' }}>{match.league.name}</dd>
              </div>
              <div>
                <dt style={{ color: '#6b7280', fontWeight: 500 }}>Game Type</dt>
                <dd style={{ color: '#111827', marginTop: '0.25rem' }}>{formatGameType(match.league.gameType)}</dd>
              </div>
              <div>
                <dt style={{ color: '#6b7280', fontWeight: 500 }}>Players</dt>
                <dd style={{ color: '#111827', marginTop: '0.25rem' }}>
                  {match.player1.name} vs {match.player2.name}
                  {match.player3 && ` vs ${match.player3.name}`}
                </dd>
              </div>
              <div>
                <dt style={{ color: '#6b7280', fontWeight: 500 }}>Game Rules</dt>
                <dd style={{ color: '#111827', marginTop: '0.25rem' }}>
                  First to {match.league.pointsToWin} points{match.league.winByTwo && ', win by 2'}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b'
            }}>
              {error}
            </div>
          )}

          <div>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Game Scores
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {games.map((game, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  padding: '1.5rem'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      Game {index + 1}
                    </h4>
                    <p style={{
                      marginTop: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Record the points for each player. Only one player can reach {match.league.pointsToWin} points.
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: `repeat(${isCutthroat ? 3 : 2}, minmax(0, 1fr))`
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {match.player1.name}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={match.league.pointsToWin || 15}
                        value={game.player1Score !== undefined ? game.player1Score : ''}
                        onChange={(e) => updateScore(index, 'player1', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          border: '1px solid #d1d5db',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#111827';
                          e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {match.player2.name}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={match.league.pointsToWin || 15}
                        value={game.player2Score !== undefined ? game.player2Score : ''}
                        onChange={(e) => updateScore(index, 'player2', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          border: '1px solid #d1d5db',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#111827';
                          e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    {isCutthroat && match.player3 && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          {match.player3.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={match.league.pointsToWin || 15}
                          value={game.player3Score !== undefined ? game.player3Score : ''}
                          onChange={(e) => updateScore(index, 'player3', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            border: '1px solid #d1d5db',
                            fontSize: '1rem',
                            outline: 'none'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#111827';
                            e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.85rem'
            }}>
              <strong>Reminder:</strong> Opponents must confirm the reported scores before the match is finalized.
            </div>
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <Link
                href="/matches"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#1f2937',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Cancel
              </Link>
              <button
                onClick={submitScores}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: isSaving ? '#4b5563' : '#1f2937',
                  border: '1px solid #1f2937',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSaving ? '#4b5563' : '#1f2937';
                }}
              >
                {isSaving ? 'Saving...' : 'Submit Scores'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
