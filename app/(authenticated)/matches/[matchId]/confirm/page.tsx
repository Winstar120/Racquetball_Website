'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface Match {
  id: string;
  scheduledTime: string;
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
  games: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    player3Score?: number;
  }>;
  scoreReportedBy?: string;
  player1Confirmed: boolean;
  player2Confirmed: boolean;
  player3Confirmed?: boolean;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
}

export default function ConfirmScore({ params }: { params: Promise<{ matchId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState<string>('');
  const [showDispute, setShowDispute] = useState(false);
  const [disputedGames, setDisputedGames] = useState<Game[]>([]);
  const [isDisputing, setIsDisputing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    params.then(p => setMatchId(p.matchId));
  }, [params]);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');

      const data = (await response.json()) as { match: Match };
      setMatch(data.match);

      // Initialize disputed games with the reported scores
      if (data.match.games) {
        setDisputedGames(
          data.match.games.map((game) => ({
            gameNumber: game.gameNumber,
            player1Score: game.player1Score,
            player2Score: game.player2Score,
            player3Score: game.player3Score,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load match details:', error);
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      void fetchMatch();
    }
  }, [fetchMatch, matchId]);

  async function confirmScore() {
    setIsConfirming(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Failed to confirm score');
      }

      // Redirect back to matches
      router.push('/matches');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm score';
      setError(message);
      setIsConfirming(false);
    }
  }

  function updateDisputedScore(gameIndex: number, player: string, value: string) {
    const score = value === '' ? 0 : parseInt(value) || 0;
    const maxScore = match?.league.pointsToWin || 15;
    const finalScore = Math.min(Math.max(0, score), maxScore);

    const updatedGames = [...disputedGames];
    if (player === 'player1') {
      updatedGames[gameIndex].player1Score = finalScore;
    } else if (player === 'player2') {
      updatedGames[gameIndex].player2Score = finalScore;
    } else if (player === 'player3') {
      updatedGames[gameIndex].player3Score = finalScore;
    }
    setDisputedGames(updatedGames);
  }

  async function submitDispute() {
    setIsDisputing(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ games: disputedGames }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Failed to submit dispute');
      }

      // Redirect back to matches
      router.push('/matches');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit dispute';
      setError(message);
      setIsDisputing(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'white', fontSize: '1.125rem' }}>Loading match details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: isMobile ? '1.75rem 0.75rem' : '2rem 1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
            color: '#b91c1c'
          }}>
            <p style={{ fontWeight: 600 }}>Match not found.</p>
            <Link
              href="/matches"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                color: '#1f2937',
                textDecoration: 'none',
                border: '1px solid #d1d5db',
                padding: '0.5rem 1rem',
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
              Back to Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  const isPlayer1 = match.player1.id === currentUserId;
  const isPlayer2 = match.player2.id === currentUserId;
  const isPlayer3 = match.player3?.id === currentUserId;
  const isParticipant = isPlayer1 || isPlayer2 || isPlayer3;

  const alreadyConfirmed = (isPlayer1 && match.player1Confirmed) ||
                          (isPlayer2 && match.player2Confirmed) ||
                          (isPlayer3 && match.player3Confirmed);

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
          padding: isMobile ? '1.25rem 0.75rem' : '1.5rem 1rem'
        }}>
          <nav style={{ display: 'flex' }} aria-label="Breadcrumb">
            <ol style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <li>
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
                }}>Confirm Score</span>
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
            Confirm Match Score
          </h1>
          <p style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.975rem'
          }}>
            Review the reported scores and either confirm them or submit corrected values if there is an issue.
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: isMobile ? '1.5rem 0.75rem 2.5rem' : '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: isMobile ? '1.5rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem'
        }}>
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

          {!isParticipant ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
                You are not a participant in this match.
              </p>
              <Link
                href="/matches"
                style={{
                  color: '#1f2937',
                  textDecoration: 'none',
                  border: '1px solid #d1d5db',
                  padding: '0.75rem 1.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 500
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
                Back to Matches
              </Link>
            </div>
          ) : alreadyConfirmed ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#047857'
            }}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', fontWeight: 600 }}>
                You have already confirmed this score.
              </p>
              <Link
                href="/matches"
                style={{
                  color: '#1f2937',
                  textDecoration: 'none',
                  border: '1px solid #d1d5db',
                  padding: '0.75rem 1.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontWeight: 500
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
                Back to Matches
              </Link>
            </div>
          ) : (
            <>
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
                    <dt style={{ color: '#6b7280', fontWeight: 500 }}>Players</dt>
                    <dd style={{ color: '#111827', marginTop: '0.25rem' }}>
                      {match.player1.name} vs {match.player2.name}
                      {match.player3 && ` vs ${match.player3.name}`}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ color: '#6b7280', fontWeight: 500 }}>Format</dt>
                    <dd style={{ color: '#111827', marginTop: '0.25rem' }}>
                      {match.league.gameType} · Best of {match.league.numberOfGames} · First to {match.league.pointsToWin}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem'
                }}>
                  Reported Scores
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {match.games.map((game, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#111827' }}>Game {index + 1}</span>
                      <span style={{ color: '#374151' }}>
                        {match.player1.name}: <strong>{game.player1Score}</strong>
                      </span>
                      <span style={{ color: '#374151' }}>
                        {match.player2.name}: <strong>{game.player2Score}</strong>
                      </span>
                      {isCutthroat && match.player3 && (
                        <span style={{ color: '#374151' }}>
                          {match.player3.name}: <strong>{game.player3Score || 0}</strong>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {match.scoreReportedBy && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    Reported by:{' '}
                    {
                      match.scoreReportedBy === match.player1.id ? match.player1.name :
                      match.scoreReportedBy === match.player2.id ? match.player2.name :
                      match.player3?.id === match.scoreReportedBy ? match.player3.name :
                      'Unknown'
                    }
                  </p>
                )}
              </div>

              {!showDispute ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    By confirming, you acknowledge these scores are accurate to the best of your knowledge.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '0.75rem',
                      flexWrap: isMobile ? 'nowrap' : 'wrap'
                    }}
                  >
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
                      onClick={() => setShowDispute(true)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: '#ca8a04',
                        border: '1px solid #ca8a04',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#b45309';
                        e.currentTarget.style.borderColor = '#b45309';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ca8a04';
                        e.currentTarget.style.borderColor = '#ca8a04';
                      }}
                    >
                      Dispute Score
                    </button>
                    <button
                      onClick={confirmScore}
                      disabled={isConfirming}
                      style={{
                        padding: '0.75rem 1.75rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: isConfirming ? '#4b5563' : '#059669',
                        border: '1px solid ' + (isConfirming ? '#4b5563' : '#059669'),
                        cursor: isConfirming ? 'not-allowed' : 'pointer',
                        opacity: isConfirming ? 0.75 : 1,
                        transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto'
                      }}
                      onMouseEnter={(e) => {
                        if (!isConfirming) {
                          e.currentTarget.style.backgroundColor = '#047857';
                          e.currentTarget.style.borderColor = '#047857';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isConfirming ? '#4b5563' : '#059669';
                        e.currentTarget.style.borderColor = isConfirming ? '#4b5563' : '#059669';
                      }}
                    >
                      {isConfirming ? 'Confirming...' : 'Confirm Score'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.75rem'
                    }}>
                      Enter Correct Scores
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#6b7280',
                      marginBottom: '1rem'
                    }}>
                      Provide the correct score for each game. Everyone involved in the match will be notified of the dispute.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {disputedGames.map((game, index) => (
                        <div
                          key={index}
                          style={{
                            border: '1px solid #e5e7eb',
                            padding: '1.5rem'
                          }}
                        >
                          <h4 style={{ fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
                            Game {index + 1}
                          </h4>
                          <div style={{
                            display: 'grid',
                            gap: '1rem',
                            gridTemplateColumns: isMobile
                              ? '1fr'
                              : `repeat(${isCutthroat ? 3 : 2}, minmax(0, 1fr))`
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
                                onChange={(e) => updateDisputedScore(index, 'player1', e.target.value)}
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
                                onChange={(e) => updateDisputedScore(index, 'player2', e.target.value)}
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
                                  onChange={(e) => updateDisputedScore(index, 'player3', e.target.value)}
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
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setShowDispute(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#1f2937',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        cursor: 'pointer',
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
                      Back
                    </button>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                        onClick={submitDispute}
                        disabled={isDisputing}
                        style={{
                          padding: '0.75rem 1.75rem',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: 'white',
                          backgroundColor: isDisputing ? '#4b5563' : '#dc2626',
                          border: '1px solid ' + (isDisputing ? '#4b5563' : '#dc2626'),
                          cursor: isDisputing ? 'not-allowed' : 'pointer',
                          opacity: isDisputing ? 0.75 : 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisputing) {
                            e.currentTarget.style.backgroundColor = '#b91c1c';
                            e.currentTarget.style.borderColor = '#b91c1c';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDisputing ? '#4b5563' : '#dc2626';
                          e.currentTarget.style.borderColor = isDisputing ? '#4b5563' : '#dc2626';
                        }}
                      >
                        {isDisputing ? 'Submitting...' : 'Submit Dispute'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
