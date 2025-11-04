'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardMetrics = {
  wins?: number;
  losses?: number;
  winRate?: number;
  totalPointsScored?: number;
  avgPointsPerGame?: number;
  totalGamesWon?: number;
  totalGamesPlayed?: number;
  gameWinRate?: number;
};

type DashboardMatchPlayer = {
  id: string;
  name: string;
};

type UpcomingMatch = {
  id: string;
  scheduledTime: string;
  player1Id: string;
  player2Id: string;
  player1: DashboardMatchPlayer;
  player2: DashboardMatchPlayer;
  league: {
    name: string;
  };
};

type DashboardData = {
  stats?: DashboardMetrics;
  upcomingMatches?: UpcomingMatch[];
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    } else if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = (await response.json()) as DashboardData;
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }

  if (status === "loading") {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Dashboard</h1>
          <p style={{
            marginTop: '0.5rem',
            color: '#d1d5db'
          }}>Welcome back, {session.user?.name}!</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <dt style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    Match Record
                  </dt>
                  <dd style={{
                    marginTop: '0.25rem',
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {isLoadingStats ? '...' : `${stats?.stats?.wins || 0}-${stats?.stats?.losses || 0}`}
                  </dd>
                  {stats?.stats?.winRate && (
                    <p style={{
                      marginTop: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {stats.stats.winRate}% win rate
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Link href="/matches?filter=past" style={{
                fontSize: '0.875rem',
                color: '#1f2937',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                View match history →
              </Link>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <dt style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    Total Points
                  </dt>
                  <dd style={{
                    marginTop: '0.25rem',
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {isLoadingStats ? '...' : stats?.stats?.totalPointsScored || 0}
                  </dd>
                  {stats?.stats?.avgPointsPerGame && (
                    <p style={{
                      marginTop: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {stats.stats.avgPointsPerGame} per game
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Link href="/standings" style={{
                fontSize: '0.875rem',
                color: '#1f2937',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                View standings →
              </Link>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <dt style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    Game Record
                  </dt>
                  <dd style={{
                    marginTop: '0.25rem',
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {isLoadingStats ? '...' : `${stats?.stats?.totalGamesWon || 0}-${(stats?.stats?.totalGamesPlayed || 0) - (stats?.stats?.totalGamesWon || 0)}`}
                  </dd>
                  {stats?.stats?.gameWinRate && (
                    <p style={{
                      marginTop: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {stats.stats.gameWinRate}% win rate
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Link href="/profile" style={{
                fontSize: '0.875rem',
                color: '#1f2937',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Update profile →
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '1rem',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Quick Actions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <Link
              href="/leagues"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: '#1f2937',
                border: '1px solid #1f2937',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }}
            >
              View Leagues
            </Link>
            <Link
              href="/matches?filter=upcoming"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: '#059669',
                border: '1px solid #059669',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
            >
              Record Score
            </Link>
            <Link
              href="/matches"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              View Schedule
            </Link>
            <Link
              href="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Edit Profile
            </Link>
            {session?.user?.isAdmin && (
              <Link
                href="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#7c3aed',
                  border: '1px solid #7c3aed',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6d28d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }}
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Upcoming Matches Section */}
        {stats?.upcomingMatches && stats.upcomingMatches.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem',
              fontFamily: 'var(--font-playfair), Georgia, serif'
            }}>Upcoming Matches</h2>
            <div style={{
              backgroundColor: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '1rem'
            }}>
              {stats.upcomingMatches.slice(0, 3).map((match) => {
                const matchDate = new Date(match.scheduledTime);
                const isPlayer1 = match.player1Id === session?.user?.id;
                const opponent = isPlayer1 ? match.player2.name : match.player1.name;

                return (
                  <div key={match.id} style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{
                        fontWeight: '500',
                        color: '#111827'
                      }}>
                        vs {opponent}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {match.league.name}
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#111827'
                      }}>
                        {matchDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div style={{
                marginTop: '1rem',
                textAlign: 'center'
              }}>
                <Link href="/matches?filter=upcoming" style={{
                  fontSize: '0.875rem',
                  color: '#1f2937',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  View all upcoming matches →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
