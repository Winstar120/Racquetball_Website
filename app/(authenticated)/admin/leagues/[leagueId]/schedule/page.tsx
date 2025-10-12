'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type PlayerSummary = {
  id: string;
  name: string;
  email?: string | null;
};

type ScheduleMatchBase = {
  id?: string;
  player1Id: string;
  player2Id: string;
  player3Id?: string | null;
  player4Id?: string | null;
  courtNumber?: number | null;
  scheduledTime: string | Date;
  weekNumber?: number | null;
  divisionId?: string | null;
  status?: string;
  isMakeup?: boolean;
};

type ScheduleMatch = ScheduleMatchBase & {
  player1?: PlayerSummary | null;
  player2?: PlayerSummary | null;
  player3?: PlayerSummary | null;
  player4?: PlayerSummary | null;
  court?: {
    name: string;
    location?: string | null;
  } | null;
};

type PreviewResponse = {
  preview: {
    scheduledMatches: ScheduleMatch[];
    makeupMatches: ScheduleMatch[];
    totalWeeks: number;
    projectedGames: number;
  };
  isGenerated: false;
};

type GeneratedResponse = {
  matches: ScheduleMatch[];
  makeupMatches: number;
  totalWeeks: number;
  totalMatches: number;
  isGenerated: true;
};

type ScheduleResponse = PreviewResponse | GeneratedResponse;

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function renderPlayers(match: ScheduleMatch) {
  const names = [
    match.player1?.name ?? 'Player 1',
    match.player2?.name ?? 'Player 2',
    match.player3?.name,
    match.player4?.name,
  ].filter(Boolean);

  return names.join(' vs ');
}

function courtLabel(match: ScheduleMatch) {
  if (match.court?.name) {
    return match.court.location ? `${match.court.name} · ${match.court.location}` : match.court.name;
  }
  if (match.courtNumber) return `Court ${match.courtNumber}`;
  return 'TBD';
}

export default function LeagueSchedulePage({ params }: { params: { leagueId: string } }) {
  const { leagueId } = params;
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'preview'; data: PreviewResponse['preview']; leagueName: string }
    | { kind: 'generated'; matches: ScheduleMatch[]; totals: Pick<GeneratedResponse, 'totalMatches' | 'totalWeeks' | 'makeupMatches'>; leagueName: string }
  >({ kind: 'loading' });
  const [isShuffling, setIsShuffling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSchedule = useCallback(async (currentLeagueId: string) => {
    setState({ kind: 'loading' });
    try {
      const response = await fetch(`/api/admin/leagues/${currentLeagueId}/schedule`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load schedule');
      const payload: ScheduleResponse = await response.json();

      // Attempt to derive league name from matches/preview data
      const sampleMatch =
        payload.isGenerated && payload.matches.length > 0
          ? payload.matches[0]
          : !payload.isGenerated && payload.preview.scheduledMatches.length > 0
          ? payload.preview.scheduledMatches[0]
          : undefined;

      const leagueName =
        (sampleMatch as any)?.league?.name ??
        (sampleMatch as any)?.player1?.league?.name ??
        'League';

      if (payload.isGenerated) {
        setState({
          kind: 'generated',
          matches: payload.matches,
          totals: {
            totalMatches: payload.totalMatches,
            totalWeeks: payload.totalWeeks,
            makeupMatches: payload.makeupMatches,
          },
          leagueName,
        });
        setFeedback(null);
      } else {
        setState({
          kind: 'preview',
          data: payload.preview,
          leagueName,
        });
        setFeedback(null);
      }
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to load schedule',
      });
    }
  }, []);

  useEffect(() => {
    if (!leagueId) return;
    fetchSchedule(leagueId);
  }, [fetchSchedule, leagueId]);

  async function handleShuffle() {
    if (!leagueId) return;
    setIsShuffling(true);
    setFeedback(null);
    try {
      await fetchSchedule(leagueId);
      setFeedback('Preview reshuffled. Review the matchups and click Save Schedule when satisfied.');
    } finally {
      setIsShuffling(false);
    }
  }

  async function handleSave() {
    if (!leagueId) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/leagues/${leagueId}/schedule`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = (payload as any)?.error ?? 'Failed to generate schedule';
        throw new Error(message);
      }
      await fetchSchedule(leagueId);
      setFeedback('Schedule saved. Matches are now available in Admin → Matches.');
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate schedule',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const header = (
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
        <nav style={{ display: 'flex' }} aria-label="Breadcrumb">
          <ol
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            <li>
              <Link href="/admin/leagues" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
                Leagues
              </Link>
              <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>/</span>
            </li>
            <li>
              <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.875rem' }}>Schedule</span>
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
          {state.kind === 'generated' || state.kind === 'preview' ? state.leagueName : 'League'} Schedule
        </h1>
        <p
          style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.95rem',
          }}
        >
          Automatically build the match calendar using available court slots. Once generated, matches will appear under Admin → Matches.
        </p>
      </div>
    </div>
  );

  function renderMatchesTable(matches: ScheduleMatch[], caption: string) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>{caption}</h2>
        </div>
        <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: '#f9fafb',
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Time</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Players</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Court</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Week</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => {
    const { date, time } = formatDateTime(match.scheduledTime);
                const statusLabel =
                  match.status ??
                  (match.isMakeup ? 'MAKEUP' : match.id ? 'Scheduled' : 'Projected');
                return (
                  <tr
                    key={`${match.player1Id}-${match.player2Id}-${index}`}
                    style={{
                      borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                    }}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#111827' }}>{date}</td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#374151' }}>{time}</td>
                    <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#111827' }}>
                      {renderPlayers(match)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#374151' }}>{courtLabel(match)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#374151' }}>
                      {match.weekNumber ?? '—'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: '#f3f4f6',
                          color:
                            statusLabel === 'COMPLETED'
                              ? '#065f46'
                              : statusLabel === 'MAKEUP'
                              ? '#92400e'
                              : '#374151',
                        }}
                      >
                        {statusLabel.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  let body: React.ReactNode;
  if (state.kind === 'loading') {
    body = (
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.75rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#6b7280' }}>Loading schedule…</p>
      </div>
    );
  } else if (state.kind === 'error') {
    body = (
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.75rem',
        }}
      >
        <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>{state.message}</p>
        <button
          onClick={fetchSchedule}
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
  } else if (state.kind === 'preview') {
    const { data } = state;
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Preview Summary
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Projected Games</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {data.projectedGames}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Weeks</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>{data.totalWeeks}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Scheduled Matches</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {data.scheduledMatches.length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Makeup Matches</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {data.makeupMatches.length}
              </p>
            </div>
          </div>
          {feedback && (
            <p style={{ marginTop: '0.75rem', color: '#2563eb', fontSize: '0.9rem' }}>{feedback}</p>
          )}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleShuffle}
              disabled={isShuffling || isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: isShuffling || isSaving ? '#4b5563' : '#1f2937',
                border: '1px solid ' + (isShuffling || isSaving ? '#4b5563' : '#1f2937'),
                cursor: isShuffling || isSaving ? 'not-allowed' : 'pointer',
                opacity: isShuffling || isSaving ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isShuffling ? 'Shuffling…' : 'Shuffle Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: isSaving ? '#4b5563' : '#2563eb',
                border: '1px solid ' + (isSaving ? '#4b5563' : '#2563eb'),
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isSaving ? 'Saving…' : 'Save Schedule'}
            </button>
            <Link
              href="/admin/matches"
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
                transition: 'all 0.2s',
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
              Manage Matches
            </Link>
          </div>
        </div>

        {renderMatchesTable(data.scheduledMatches, 'Projected Matches')}

        {data.makeupMatches.length > 0 && renderMatchesTable(data.makeupMatches, 'Potential Makeup Matches')}
      </div>
    );
  } else {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Schedule Generated
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Matches</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {state.totals.totalMatches}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Weeks</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>{state.totals.totalWeeks}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Makeup Matches</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {state.totals.makeupMatches}
              </p>
            </div>
          </div>
          <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
            Matches are now available on the Admin → Matches page for further adjustments, court changes, or manual overrides.
          </p>
          {feedback && (
            <p style={{ marginTop: '0.75rem', color: '#2563eb', fontSize: '0.9rem' }}>{feedback}</p>
          )}
          <Link
            href="/admin/matches"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: '#1f2937',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              transition: 'all 0.2s',
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
            Go to Matches
          </Link>
        </div>

        {renderMatchesTable(
          state.matches,
          'Scheduled Matches'
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      {header}
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}
      >
        {body}
      </div>
    </div>
  );
}
