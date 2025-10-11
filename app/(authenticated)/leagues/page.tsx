'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatGameType } from '@/lib/utils';

interface League {
  id: string;
  name: string;
  gameType: string;
  rankingMethod: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  status: string;
  isFree: boolean;
  leagueFee?: number;
  divisions: Division[];
  _count: {
    registrations: number;
  };
  userRegistration?: {
    status: string;
    division?: Division;
  };
}

interface Division {
  id: string;
  name: string;
  level: string;
}

export default function Leagues() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLeagues();
    }
  }, [status, router]);

  async function fetchLeagues() {
    try {
      const response = await fetch('/api/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data.leagues || []);
    } catch (err) {
      setError('Failed to load leagues');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(leagueId: string, divisionLevel: string) {
    try {
      const response = await fetch('/api/leagues/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, divisionLevel }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
      }

      await fetchLeagues();
      alert('Successfully registered for the league!');
    } catch (err: any) {
      alert(err.message || 'Failed to register for league');
    }
  }

  async function handleCancelRegistration(leagueId: string) {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    try {
      const response = await fetch(`/api/leagues/${leagueId}/registration`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel registration');

      await fetchLeagues();
      alert('Registration cancelled successfully');
    } catch (err) {
      alert('Failed to cancel registration');
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isRegistrationOpen = (league: League) => {
    const now = new Date();
    const opens = new Date(league.registrationOpens);
    const closes = new Date(league.registrationCloses);
    return now >= opens && now <= closes;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white' }}>Loading leagues...</div>
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
                    <span style={{
                      color: '#111827',
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>Leagues</span>
                  </li>
                </ol>
              </nav>
              <h1 style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif'
              }}>Available Leagues</h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
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

        {leagues.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280' }}>No leagues are currently available.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {leagues.map((league) => (
              <div key={league.id} style={{
                backgroundColor: 'white',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      color: '#111827',
                      fontFamily: 'var(--font-playfair), Georgia, serif'
                    }}>{league.name}</h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.125rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: league.userRegistration
                        ? '#d1fae5'
                        : isRegistrationOpen(league)
                        ? '#fef3c7'
                        : '#f3f4f6',
                      color: league.userRegistration
                        ? '#065f46'
                        : isRegistrationOpen(league)
                        ? '#92400e'
                        : '#374151'
                    }}>
                      {league.userRegistration
                        ? 'Registered'
                        : isRegistrationOpen(league)
                        ? 'Registration Open'
                        : 'Registration Closed'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      }}>
                        {formatGameType(league.gameType)}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#ede9fe',
                        color: '#5b21b6'
                      }}>
                        Ranked by {league.rankingMethod === 'BY_POINTS' ? 'Points' : 'Wins'}
                      </span>
                    </div>
                    <div>
                      <strong>Dates:</strong> {formatDate(league.startDate)} - {formatDate(league.endDate)}
                    </div>
                    <div>
                      <strong>Registration:</strong> {formatDate(league.registrationOpens)} - {formatDate(league.registrationCloses)}
                    </div>
                    <div>
                      <strong>Players registered:</strong> {league._count.registrations}
                    </div>
                    <div>
                      <strong>League Fee:</strong> {' '}
                      {league.isFree ? (
                        <span style={{ color: '#10b981', fontWeight: '600' }}>FREE</span>
                      ) : (
                        <span style={{ fontWeight: '600' }}>${league.leagueFee?.toFixed(2) || '0.00'}</span>
                      )}
                    </div>
                    {league.userRegistration?.division && (
                      <div>
                        <strong>Your Division:</strong> {league.userRegistration.division.name}
                      </div>
                    )}
                  </div>

                  {league.userRegistration ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#059669',
                        fontWeight: '500'
                      }}>
                        ✓ You are registered for this league
                      </div>
                      <button
                        onClick={() => handleCancelRegistration(league.id)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#991b1b',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                        }}
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : isRegistrationOpen(league) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Select your skill level:
                      </label>
                      <select
                        id={`division-${league.id}`}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        defaultValue=""
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#111827';
                          e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" disabled>Choose division</option>
                        {league.divisions.map((division) => (
                          <option key={division.id} value={division.level}>
                            {division.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById(`division-${league.id}`) as HTMLSelectElement;
                          if (select.value) {
                            handleRegister(league.id, select.value);
                          } else {
                            alert('Please select a division');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: '#1f2937',
                          border: '1px solid #1f2937',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#111827';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                        }}
                      >
                        Register for League
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Registration is currently closed
                    </div>
                  )}

                  {/* View Standings Button */}
                  <Link
                    href={`/standings?leagueId=${league.id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#1f2937',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      textAlign: 'center',
                      textDecoration: 'none',
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
                    View Standings
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}