'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatGameType } from '@/lib/utils';

interface League {
  id: string;
  name: string;
  gameType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  registrationOpens: string;
  registrationCloses: string;
  divisions: { id: string; level: string; name: string }[];
  _count: { registrations: number };
}

export default function ManageLeaguesPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/admin/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data.leagues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      UPCOMING: 'bg-gray-100 text-gray-800',
      REGISTRATION_OPEN: 'bg-green-100 text-green-800',
      REGISTRATION_CLOSED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDateOrPending = (value: string | null) => {
    if (!value) return 'Pending';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Pending' : parsed.toLocaleDateString();
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#111827',
              fontFamily: 'var(--font-playfair), Georgia, serif'
            }}>
              Manage Leagues
            </h1>
            <p style={{
              marginTop: '0.35rem',
              color: '#6b7280',
              fontSize: '0.95rem'
            }}>
              Review active seasons, update schedules, and monitor registrations.
            </p>
          </div>
          <Link
            href="/admin/leagues/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
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
            Create League
          </Link>
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

        {loading ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem'
          }}>
            <p style={{ color: '#6b7280' }}>Loading leagues...</p>
          </div>
        ) : leagues.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No leagues created yet.</p>
            <Link
              href="/admin/leagues/create"
              style={{
                color: '#1f2937',
                textDecoration: 'none',
                border: '1px solid #d1d5db',
                padding: '0.65rem 1.25rem',
                display: 'inline-block',
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
              Create your first league
            </Link>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '0'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>League</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Divisions</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Players</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Season</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leagues.map((league, index) => (
                    <tr
                      key={league.id}
                      style={{
                        borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                        backgroundColor: 'white'
                      }}
                    >
                      <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{league.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Reg: {new Date(league.registrationOpens).toLocaleDateString()} – {new Date(league.registrationCloses).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#374151', fontSize: '0.9rem' }}>
                        {formatGameType(league.gameType)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {getStatusBadge(league.status)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#374151', fontSize: '0.9rem' }}>
                        {league.divisions.length ? league.divisions.map(d => d.level).join(', ') : '—'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#374151', fontSize: '0.9rem' }}>
                        {league._count.registrations}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#374151', fontSize: '0.9rem' }}>
                        {formatDateOrPending(league.startDate)} – {formatDateOrPending(league.endDate)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                          <Link
                            href={`/admin/leagues/${league.id}/schedule`}
                            style={{ color: '#2563eb', textDecoration: 'none' }}
                          >
                            Schedule
                          </Link>
                          <Link
                            href={`/admin/leagues/${league.id}/registrations`}
                            style={{ color: '#059669', textDecoration: 'none' }}
                          >
                            Registrations
                          </Link>
                          <Link
                            href={`/admin/leagues/${league.id}`}
                            style={{ color: '#4b5563', textDecoration: 'none' }}
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
