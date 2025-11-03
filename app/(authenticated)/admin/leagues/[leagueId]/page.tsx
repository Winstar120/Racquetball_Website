'use client';

import {
  useEffect,
  useState,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type League = {
  id: string;
  name: string;
  description?: string | null;
  gameType: string;
  rankingMethod: string;
  pointsToWin: number;
  numberOfGames: number;
  matchDuration: number;
  startDate: string | null;
  endDate: string | null;
  registrationOpens: string;
  registrationCloses: string;
  isFree: boolean;
  leagueFee: number | null;
  scheduleGenerated: boolean;
};

const baseInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid #d1d5db',
  fontSize: '1rem',
  color: '#111827',
  outline: 'none',
  backgroundColor: 'white',
};

function focusHandlers(disabled?: boolean) {
  if (disabled) return {};
  return {
    onFocus: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = '#111827';
      e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
    },
    onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = '#d1d5db';
      e.currentTarget.style.boxShadow = 'none';
    },
  };
}

function formatDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function EditLeaguePage({ params }: { params: Promise<{ leagueId: string }> }) {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; league: League }
  >({ kind: 'loading' });

  const [form, setForm] = useState({
    name: '',
    description: '',
    gameType: 'SINGLES',
    rankingMethod: 'BY_WINS',
    pointsToWin: '11',
    matchDuration: '45',
    numberOfGames: '3',
    startDate: '',
    endDate: '',
    registrationOpens: '',
    registrationCloses: '',
    isFree: 'true',
    leagueFee: '0',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    params.then((value) => {
      if (isMounted) setLeagueId(value.leagueId);
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  async function loadLeague(currentLeagueId: string) {
    setState({ kind: 'loading' });
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/leagues/${currentLeagueId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load league');
      const payload = await response.json();
      const league: League = payload.league;

      setForm({
        name: league.name ?? '',
        description: league.description ?? '',
        gameType: league.gameType,
        rankingMethod: league.rankingMethod,
        pointsToWin: String(league.pointsToWin ?? 11),
        numberOfGames: String(league.numberOfGames ?? 3),
        matchDuration: String(league.matchDuration ?? 45),
        startDate: formatDateInput(league.startDate),
        endDate: formatDateInput(league.endDate),
        registrationOpens: formatDateInput(league.registrationOpens),
        registrationCloses: formatDateInput(league.registrationCloses),
        isFree: league.isFree ? 'true' : 'false',
        leagueFee: String(league.leagueFee ?? 0),
      });
      setState({ kind: 'ready', league });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to load league',
      });
    }
  }

  useEffect(() => {
    if (!leagueId) return;
    loadLeague(leagueId);
  }, [leagueId]);

  function handleChange<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => {
      if (key === 'isFree') {
        const isFree = value === 'true';
        return {
          ...prev,
          isFree: value,
          leagueFee: isFree ? '0' : prev.leagueFee,
        };
      }
      return { ...prev, [key]: value };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind !== 'ready' || !leagueId) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        rankingMethod: form.rankingMethod,
        gameType: form.gameType,
        pointsToWin: Number(form.pointsToWin),
        numberOfGames: Number(form.numberOfGames),
        matchDuration: Number(form.matchDuration),
        startDate: form.startDate,
        endDate: form.endDate,
        registrationOpens: form.registrationOpens,
        registrationCloses: form.registrationCloses,
        isFree: form.isFree === 'true',
        leagueFee: Number(form.leagueFee),
      };

      const response = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data as any).error ?? 'Failed to update league';
        throw new Error(message);
      }

      const data = await response.json();
      setMessage('League updated successfully.');
      const updated: League = data.league;
      setForm({
        name: updated.name ?? '',
        description: updated.description ?? '',
        gameType: updated.gameType,
        rankingMethod: updated.rankingMethod,
        pointsToWin: String(updated.pointsToWin ?? 11),
        numberOfGames: String(updated.numberOfGames ?? 3),
        matchDuration: String(updated.matchDuration ?? 45),
        startDate: formatDateInput(updated.startDate),
        endDate: formatDateInput(updated.endDate),
        registrationOpens: formatDateInput(updated.registrationOpens),
        registrationCloses: formatDateInput(updated.registrationCloses),
        isFree: updated.isFree ? 'true' : 'false',
        leagueFee: String(updated.leagueFee ?? 0),
      });
      setState({ kind: 'ready', league: data.league });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update league');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Deleting this league will remove all matches, registrations, and divisions. This action cannot be undone. Do you want to continue?'
      )
    ) {
      return;
    }
    if (!leagueId) return;
    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data as any).error ?? 'Failed to delete league';
        throw new Error(message);
      }
      router.push('/admin/leagues');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete league');
    } finally {
      setDeleting(false);
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
              <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.875rem' }}>Edit</span>
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
          {state.kind === 'ready' ? state.league.name : 'League'} Settings
        </h1>
        <p
          style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.95rem',
          }}
        >
          Update basic league configuration or retire the league entirely.
        </p>
      </div>
    </div>
  );

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
        <p style={{ color: '#6b7280' }}>Loading league details…</p>
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
          onClick={() => leagueId && loadLeague(leagueId)}
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
  } else {
    const scheduleGenerated = state.league.scheduleGenerated;
    body = (
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Basic Details
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <div>
              <label
                htmlFor="name"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                League Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              />
            </div>
            <div>
              <label
                htmlFor="rankingMethod"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Ranking Method
              </label>
              <select
                id="rankingMethod"
                value={form.rankingMethod}
                onChange={(e) => handleChange('rankingMethod', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              >
                <option value="BY_WINS">By Wins</option>
                <option value="BY_POINTS">By Total Points</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="gameType"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Game Type
              </label>
              <select
                id="gameType"
                value={form.gameType}
                onChange={(e) => handleChange('gameType', e.target.value)}
                disabled={scheduleGenerated}
                style={{
                  ...baseInputStyle,
                  backgroundColor: scheduleGenerated ? '#f9fafb' : 'white',
                  cursor: scheduleGenerated ? 'not-allowed' : 'pointer',
                }}
                {...focusHandlers(scheduleGenerated)}
              >
                <option value="SINGLES">Singles</option>
                <option value="DOUBLES">Doubles</option>
                <option value="CUTTHROAT">Cut-throat</option>
              </select>
              {scheduleGenerated && (
                <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                  Game type cannot be changed after a schedule is generated.
                </p>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                htmlFor="description"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                style={{ ...baseInputStyle, resize: 'vertical' }}
                {...focusHandlers(false)}
              />
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Scoring & Duration
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
        >
          <div>
            <label
              htmlFor="pointsToWin"
              style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
            >
              Points to Win
            </label>
            <input
              id="pointsToWin"
              type="number"
              min="1"
              value={form.pointsToWin}
              onChange={(e) => handleChange('pointsToWin', e.target.value)}
              style={baseInputStyle}
              {...focusHandlers(false)}
            />
          </div>
          <div>
            <label
              htmlFor="numberOfGames"
              style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
            >
              Number of Games
            </label>
            <input
              id="numberOfGames"
              type="number"
              min="1"
              value={form.numberOfGames}
              onChange={(e) => handleChange('numberOfGames', e.target.value)}
              style={baseInputStyle}
              {...focusHandlers(false)}
            />
            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
              Controls how many games each matchup should include.
            </p>
          </div>
          <div>
            <label
              htmlFor="matchDuration"
              style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
            >
              Match Duration (minutes)
            </label>
            <input
              id="matchDuration"
              type="number"
              min="1"
              value={form.matchDuration}
              onChange={(e) => handleChange('matchDuration', e.target.value)}
              style={baseInputStyle}
              {...focusHandlers(false)}
            />
            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
              Includes any built-in warmup time.
            </p>
          </div>
        </div>
      </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Season Dates
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Clear a date to mark it as pending until you are ready to schedule.
          </p>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <div>
              <label
                htmlFor="startDate"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Season Starts
              </label>
              <input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Season Ends
              </label>
              <input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              />
            </div>
            <div>
              <label
                htmlFor="registrationOpens"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Registration Opens
              </label>
              <input
                id="registrationOpens"
                type="date"
                value={form.registrationOpens}
                onChange={(e) => handleChange('registrationOpens', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              />
            </div>
            <div>
              <label
                htmlFor="registrationCloses"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                Registration Closes
              </label>
              <input
                id="registrationCloses"
                type="date"
                value={form.registrationCloses}
                onChange={(e) => handleChange('registrationCloses', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              />
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Registration & Fees
          </h2>
          <div
            style={{
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <div>
              <label
                htmlFor="isFree"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                League Type
              </label>
              <select
                id="isFree"
                value={form.isFree}
                onChange={(e) => handleChange('isFree', e.target.value)}
                style={baseInputStyle}
                {...focusHandlers(false)}
              >
                <option value="true">Free</option>
                <option value="false">Paid</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="leagueFee"
                style={{ display: 'block', fontSize: '0.95rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
              >
                League Fee (USD)
              </label>
              <input
                id="leagueFee"
                type="number"
                min="0"
                step="0.01"
                value={form.leagueFee}
                onChange={(e) => handleChange('leagueFee', e.target.value)}
                disabled={form.isFree === 'true'}
                style={{
                  ...baseInputStyle,
                  backgroundColor: form.isFree === 'true' ? '#f9fafb' : 'white',
                  cursor: form.isFree === 'true' ? 'not-allowed' : 'text',
                }}
                {...focusHandlers(form.isFree === 'true')}
              />
            </div>
          </div>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <Link
            href="/admin/leagues"
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
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: saving ? '#4b5563' : '#1f2937',
              border: '1px solid ' + (saving ? '#4b5563' : '#1f2937'),
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.75 : 1,
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <section
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
            border: '1px solid #fecaca',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#b91c1c', marginBottom: '0.75rem' }}>
            Delete League
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Removing a league will permanently delete all related matches, registrations, and divisions. This cannot
            be undone.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: deleting ? '#7f1d1d' : '#b91c1c',
              border: '1px solid ' + (deleting ? '#7f1d1d' : '#b91c1c'),
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.75 : 1,
              transition: 'all 0.2s',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete League'}
          </button>
        </section>
      </form>
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
