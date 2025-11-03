'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type DivisionSummary = {
  id: string;
  name: string;
  level: string;
  registrations: number;
};

type LeagueDetails = {
  id: string;
  name: string;
  description?: string | null;
  gameType: string;
  rankingMethod: string;
  pointsToWin: number;
  numberOfGames: number;
  matchDuration: number;
  weeksForCutthroat?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  registrationOpens: string;
  registrationCloses: string;
  isFree: boolean;
  leagueFee?: number | null;
  playersPerMatch: number;
  status: string;
  blackoutDates: string[];
  scheduleGenerated: boolean;
  divisionSummaries: DivisionSummary[];
  counts: {
    registrations: number;
    matches: number;
  };
};

export default function LeagueDetailsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; league: LeagueDetails }
  >({ kind: 'loading' });

  useEffect(() => {
    let mounted = true;
    params.then((value) => {
      if (!mounted) return;
      setLeagueId(value.leagueId);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!leagueId) return;
    let active = true;

    async function loadLeague() {
      setState({ kind: 'loading' });
      try {
        const response = await fetch(`/api/leagues/${leagueId}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to load league details');
        }
        const payload = await response.json();
        if (active) {
          setState({ kind: 'ready', league: payload.league as LeagueDetails });
        }
      } catch (error) {
        if (!active) return;
        setState({
          kind: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to load league details',
        });
      }
    }

    loadLeague();
    return () => {
      active = false;
    };
  }, [leagueId]);

  const formatDate = (value?: string | null) => {
    if (!value) return 'Pending';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Pending';
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatBlackoutDates = (dates: string[]) => {
    if (!dates || dates.length === 0) return 'None';
    const formatted = dates
      .map((date) => {
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      })
      .filter(Boolean);
    return formatted.length ? formatted.join(', ') : 'None';
  };

  const renderBody = () => {
    if (state.kind === 'loading') {
      return (
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#6b7280' }}>Loading league details…</p>
        </div>
      );
    }

    if (state.kind === 'error') {
      return (
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
          }}
        >
          <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>{state.message}</p>
          <button
            onClick={() => router.refresh()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: '#1f2937',
              border: '1px solid #1f2937',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    const league = state.league;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
            Overview
          </h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1rem' }}>
            {league.description || 'No description provided.'}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              color: '#374151',
              fontSize: '0.95rem',
            }}
          >
            <div>
              <strong>Status:</strong> {league.status.replace('_', ' ')}
            </div>
            <div>
              <strong>Game Type:</strong> {league.gameType}
            </div>
            <div>
              <strong>Ranking Method:</strong> {league.rankingMethod === 'BY_POINTS' ? 'By Points' : 'By Wins'}
            </div>
            <div>
              <strong>Players / Match:</strong> {league.playersPerMatch}
            </div>
            <div>
              <strong>League Fee:</strong> {league.isFree ? 'FREE' : `$${league.leagueFee?.toFixed(2) || '0.00'}`}
            </div>
            <div>
              <strong>Registrations:</strong> {league.counts.registrations}
            </div>
            <div>
              <strong>Matches Scheduled:</strong> {league.counts.matches}
            </div>
            <div>
              <strong>Schedule Generated:</strong> {league.scheduleGenerated ? 'Yes' : 'Not yet'}
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Timeline
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              color: '#374151',
            }}
          >
            <div>
              <strong>Registration Opens:</strong>
              <div>{formatDate(league.registrationOpens)}</div>
            </div>
            <div>
              <strong>Registration Closes:</strong>
              <div>{formatDate(league.registrationCloses)}</div>
            </div>
            <div>
              <strong>Season Starts:</strong>
              <div>{formatDate(league.startDate)}</div>
            </div>
            <div>
              <strong>Season Ends:</strong>
              <div>{formatDate(league.endDate)}</div>
            </div>
            <div>
              <strong>Blackout Dates:</strong>
              <div>{formatBlackoutDates(league.blackoutDates)}</div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Rules & Format
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              color: '#374151',
            }}
          >
            <div>
              <strong>Points to Win:</strong>
              <div>{league.pointsToWin}</div>
            </div>
            <div>
              <strong>Number of Games:</strong>
              <div>{league.numberOfGames}</div>
            </div>
            <div>
              <strong>Match Duration:</strong>
              <div>{league.matchDuration} minutes</div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Divisions
          </h2>
          {league.divisionSummaries.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No divisions configured.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Division</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Level</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Registered Players</th>
                  </tr>
                </thead>
                <tbody>
                  {league.divisionSummaries.map((division, index) => (
                    <tr
                      key={division.id}
                      style={{
                        borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        fontSize: '0.95rem',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.5rem' }}>{division.name}</td>
                      <td style={{ padding: '0.85rem 1.5rem' }}>{division.level}</td>
                      <td style={{ padding: '0.85rem 1.5rem' }}>{division.registrations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1.5rem 1rem',
          }}
        >
          <nav style={{ display: 'flex' }} aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
                padding: 0,
                listStyle: 'none',
                color: '#6b7280',
                fontSize: '0.875rem',
              }}
            >
              <li>
                <Link href="/leagues" style={{ color: '#6b7280', textDecoration: 'none' }}>
                  Leagues
                </Link>
                <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>/</span>
              </li>
              <li>
                <span style={{ color: '#111827', fontWeight: 500 }}>
                  {state.kind === 'ready' ? state.league.name : 'League'}
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
            {state.kind === 'ready' ? state.league.name : 'League Details'}
          </h1>
          <p style={{ marginTop: '0.35rem', color: '#6b7280' }}>
            Review the configuration, schedule window, and division structure for this league.
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: '70rem',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}
      >
        {renderBody()}
      </div>
    </div>
  );
}
