'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';

type Division = {
  id: string;
  name: string;
  level: string;
};

type LeagueSummary = {
  id: string;
  name: string;
  isFree: boolean;
  gameType: string;
  divisions: Division[];
};

type Registration = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    skillLevel: string | null;
  };
  division?: Division | null;
  status: string;
  paymentStatus: string;
  registrationDate: string;
};

type FetchResponse = {
  league: LeagueSummary;
  registrations: Registration[];
};

type UserSummary = {
  id: string;
  name: string;
  email: string;
  skillLevel?: string | null;
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
    onFocus: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = '#111827';
      e.currentTarget.style.boxShadow = '0 0 0 1px #111827';
    },
    onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = '#d1d5db';
      e.currentTarget.style.boxShadow = 'none';
    },
  };
}

export default function LeagueRegistrationsPage({ params }: { params: { leagueId: string } }) {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; league: LeagueSummary; registrations: Registration[] }
  >({ kind: 'loading' });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function fetchRegistrations() {
    setState({ kind: 'loading' });
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/leagues/${params.leagueId}/registrations`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load registrations');
      const data: FetchResponse = await response.json();
      const defaultDivision = data.league.divisions[0]?.id ?? '';
      setSelectedDivision((prev) => (prev ? prev : defaultDivision));
      setState({ kind: 'ready', league: data.league, registrations: data.registrations });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to load registrations',
      });
    }
  }

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.leagueId]);

  const registeredUserIds = useMemo(() => {
    if (state.kind !== 'ready') return new Set<string>();
    return new Set(state.registrations.map((reg) => reg.user.id));
  }, [state]);

  async function searchUsers() {
    setActionError(null);
    setActionMessage(null);
    setIsSearching(true);
    try {
      const query = searchTerm.trim();
      const url = query ? `/api/admin/users?search=${encodeURIComponent(query)}` : '/api/admin/users';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      const results: UserSummary[] = (data.users || [])
        .filter((user: any) => !registeredUserIds.has(user.id))
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          skillLevel: user.skillLevel,
        }));
      setSearchResults(results);
      if (results.length === 0) {
        setActionMessage(
          query
            ? 'No matching users found or all are already registered.'
            : 'All users are already registered for this league.'
        );
      } else {
        setActionMessage(null);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function addRegistration(userId: string) {
    if (!selectedDivision) {
      setActionError('Select a division before adding a player.');
      return;
    }
    setPendingUserId(userId);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/leagues/${params.leagueId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          divisionId: selectedDivision,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = (payload as any).error ?? 'Failed to add registration';
        throw new Error(message);
      }
      const data = await response.json();
      if (state.kind === 'ready') {
        setState({
          kind: 'ready',
          league: state.league,
          registrations: [data.registration, ...state.registrations],
        });
      }
      setSearchResults((prev) => prev.filter((user) => user.id !== userId));
      setActionMessage('Player successfully added to the league.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add registration');
    } finally {
      setPendingUserId(null);
    }
  }

  async function removeRegistration(registrationId: string) {
    if (!confirm('Remove this player from the league?')) return;
    setRemovingId(registrationId);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(
        `/api/admin/leagues/${params.leagueId}/registrations?registrationId=${registrationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = (payload as any).error ?? 'Failed to remove registration';
        throw new Error(message);
      }
      if (state.kind === 'ready') {
        setState({
          kind: 'ready',
          league: state.league,
          registrations: state.registrations.filter((reg) => reg.id !== registrationId),
        });
      }
      setActionMessage('Player removed from the league.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove registration');
    } finally {
      setRemovingId(null);
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
              <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.875rem' }}>Registrations</span>
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
          {state.kind === 'ready' ? state.league.name : 'League'} Registrations
        </h1>
        <p
          style={{
            marginTop: '0.25rem',
            color: '#6b7280',
            fontSize: '0.95rem',
          }}
        >
          Add or remove players from this league. New players must be registered users in the system.
        </p>
      </div>
    </div>
  );

  let body: ReactNode;

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
        <p style={{ color: '#6b7280' }}>Loading registrations…</p>
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
          onClick={fetchRegistrations}
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
    const { league, registrations } = state;

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
            Overview
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Players</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>{registrations.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Divisions</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>{league.divisions.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>League Type</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                {league.isFree ? 'Free' : 'Paid'}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Add Player
          </h2>
          {league.divisions.length === 0 ? (
            <p style={{ color: '#b91c1c' }}>
              This league does not have any divisions configured. Add divisions before registering players.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSearching}
                  style={baseInputStyle}
                  {...focusHandlers(isSearching)}
                />
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  disabled={isSearching}
                  style={baseInputStyle}
                  {...focusHandlers(isSearching)}
                >
                  {league.divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name} ({division.level})
                    </option>
                  ))}
                </select>
                <button
                  onClick={searchUsers}
                  disabled={isSearching}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: isSearching ? '#4b5563' : '#1f2937',
                    border: '1px solid ' + (isSearching ? '#4b5563' : '#1f2937'),
                    cursor: isSearching ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isSearching ? 'Searching…' : 'Search Users'}
                </button>
              </div>
              {actionMessage && (
                <p style={{ color: '#047857', marginBottom: '1rem' }}>{actionMessage}</p>
              )}
              {actionError && (
                <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>{actionError}</p>
              )}
              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: '1rem',
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                    Search Results
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          padding: '0.75rem 1rem',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>{user.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{user.email}</div>
                          {user.skillLevel && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                              Skill Level: {user.skillLevel}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => addRegistration(user.id)}
                          disabled={pendingUserId === user.id}
                          style={{
                            padding: '0.6rem 1.25rem',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'white',
                            backgroundColor: pendingUserId === user.id ? '#4b5563' : '#1f2937',
                            border: '1px solid ' + (pendingUserId === user.id ? '#4b5563' : '#1f2937'),
                            cursor: pendingUserId === user.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {pendingUserId === user.id ? 'Adding…' : 'Add to League'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>Current Registrations</h2>
          </div>
          <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
            {registrations.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No players registered yet.</p>
            ) : (
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
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Player</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Division</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Contact</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Skill</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Registered</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Payment</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, index) => {
                    const registrationDate = new Date(reg.registrationDate).toLocaleDateString();
                    return (
                      <tr
                        key={reg.id}
                        style={{
                          borderTop: index === 0 ? 'none' : '1px solid #e5e7eb',
                        }}
                      >
                        <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#111827' }}>
                          <div style={{ fontWeight: 600 }}>{reg.user.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{reg.user.email}</div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#374151' }}>
                          {reg.division ? `${reg.division.name} (${reg.division.level})` : '—'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                          {reg.user.phone || '—'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                          {reg.user.skillLevel || 'Unrated'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151' }}>{registrationDate}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                          {reg.paymentStatus}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => removeRegistration(reg.id)}
                            disabled={removingId === reg.id}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              color: '#b91c1c',
                              backgroundColor: 'white',
                              border: '1px solid #fca5a5',
                              cursor: removingId === reg.id ? 'not-allowed' : 'pointer',
                              opacity: removingId === reg.id ? 0.75 : 1,
                            }}
                          >
                            {removingId === reg.id ? 'Removing…' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
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
