'use client';

import { useState } from 'react';
import type { FormEvent, FocusEvent, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const baseInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  border: '1px solid #d1d5db',
  fontSize: '1rem',
  color: '#111827',
  outline: 'none',
  backgroundColor: 'white' as const,
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

export default function CreateLeague() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [gameType, setGameType] = useState('SINGLES');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const blackoutDatesRaw = formData.get('blackoutDates');
    const blackoutDates =
      typeof blackoutDatesRaw === 'string'
        ? blackoutDatesRaw
            .split(/[\n\r,]+/)
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

    const leagueData = {
      name: formData.get('name'),
      gameType: formData.get('gameType'),
      rankingMethod: formData.get('rankingMethod'),
      pointsToWin: parseInt(formData.get('pointsToWin') as string),
      winByTwo: formData.get('winByTwo') === 'true',
      isFree: formData.get('isFree') === 'true',
      leagueFee: formData.get('isFree') === 'true' ? 0 : parseFloat(formData.get('leagueFee') as string),
      playersPerMatch:
        formData.get('gameType') === 'SINGLES'
          ? 2
          : formData.get('gameType') === 'CUTTHROAT'
          ? 3
          : 4,
      matchDuration: parseInt(formData.get('matchDuration') as string),
      weeksForCutthroat:
        formData.get('gameType') === 'CUTTHROAT'
          ? parseInt(formData.get('weeksForCutthroat') as string)
          : null,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      registrationOpens: formData.get('registrationOpens'),
      registrationCloses: formData.get('registrationCloses'),
      divisions: formData.getAll('divisions'),
      blackoutDates,
    };

    try {
      const response = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leagueData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create league');
        return;
      }

      router.push('/admin/leagues');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
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
                <Link
                  href="/admin"
                  style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  Admin
                </Link>
                <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>/</span>
              </li>
              <li>
                <Link
                  href="/admin/leagues"
                  style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  Leagues
                </Link>
                <span style={{ margin: '0 0.5rem', color: '#9ca3af' }}>/</span>
              </li>
              <li>
                <span style={{ color: '#111827', fontWeight: 500, fontSize: '0.875rem' }}>
                  Create
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
            Create New League
          </h1>
          <p
            style={{
              marginTop: '0.25rem',
              color: '#6b7280',
              fontSize: '0.975rem',
            }}
          >
            Configure the season structure, scoring rules, and registration window before inviting
            players.
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
        <div
          style={{
            backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2.25rem',
            maxWidth: '46rem',
            margin: '0 auto',
          }}
        >
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {error && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                }}
              >
                {error}
              </div>
            )}

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Basic Information
              </h2>
              <div style={{ maxWidth: '22rem', margin: '0 auto' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.5rem',
                  }}
                >
                  League Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  disabled={isLoading}
                  placeholder="Winter League 2025"
                  style={baseInputStyle}
                  {...focusHandlers(isLoading)}
                />
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Game Settings
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  maxWidth: '40rem',
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  <div>
                    <label
                      htmlFor="gameType"
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Game Type
                    </label>
                    <select
                      name="gameType"
                      id="gameType"
                      required
                      disabled={isLoading}
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value)}
                      style={baseInputStyle}
                      {...focusHandlers(isLoading)}
                    >
                      <option value="SINGLES">Singles (1v1)</option>
                      <option value="DOUBLES">Doubles (2v2)</option>
                      <option value="CUTTHROAT">Cut-throat (3 players)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="rankingMethod"
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Ranking Method
                    </label>
                    <select
                      name="rankingMethod"
                      id="rankingMethod"
                      required
                      disabled={isLoading}
                      style={baseInputStyle}
                      {...focusHandlers(isLoading)}
                    >
                      <option value="BY_WINS">By Wins (Traditional)</option>
                      <option value="BY_POINTS">By Total Points Scored</option>
                    </select>
                    <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      Determines how standings are ordered.
                    </p>
                  </div>
                </div>

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
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Points to Win
                    </label>
                    <input
                      type="number"
                      name="pointsToWin"
                      id="pointsToWin"
                      defaultValue="11"
                      min="7"
                      max="21"
                      required
                      disabled={isLoading}
                      style={baseInputStyle}
                      {...focusHandlers(isLoading)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="winByTwo"
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Win by Two
                    </label>
                    <select
                      name="winByTwo"
                      id="winByTwo"
                      required
                      disabled={isLoading}
                      style={baseInputStyle}
                      {...focusHandlers(isLoading)}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: '1.5rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  }}
                >
                  <div>
                    <label
                      htmlFor="matchDuration"
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Match Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="matchDuration"
                      id="matchDuration"
                      defaultValue="45"
                      min="30"
                      max="120"
                      required
                      disabled={isLoading}
                      style={baseInputStyle}
                      {...focusHandlers(isLoading)}
                    />
                    <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      Includes pre-match warmup time.
                    </p>
                  </div>
                  {gameType === 'CUTTHROAT' && (
                    <div>
                      <label
                        htmlFor="weeksForCutthroat"
                        style={{
                          display: 'block',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Number of Weeks
                      </label>
                      <input
                        type="number"
                        name="weeksForCutthroat"
                        id="weeksForCutthroat"
                        defaultValue="8"
                        min="4"
                        max="20"
                        required
                        disabled={isLoading}
                        style={baseInputStyle}
                        {...focusHandlers(isLoading)}
                      />
                      <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        Recommended 8–12 weeks for rotating matchups.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
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
                    style={{
                      display: 'block',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Registration Type
                  </label>
                  <select
                    name="isFree"
                    id="isFree"
                    disabled={isLoading}
                    value={isFree ? 'true' : 'false'}
                    onChange={(e) => setIsFree(e.target.value === 'true')}
                    style={baseInputStyle}
                    {...focusHandlers(isLoading)}
                  >
                    <option value="true">Free League</option>
                    <option value="false">Paid League</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="leagueFee"
                    style={{
                      display: 'block',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.5rem',
                    }}
                  >
                    League Fee (USD)
                  </label>
                  <input
                    type="number"
                    name="leagueFee"
                    id="leagueFee"
                    min="0"
                    step="0.01"
                    disabled={isLoading || isFree}
                    defaultValue="0"
                    style={{
                      ...baseInputStyle,
                      backgroundColor: isFree ? '#f9fafb' : 'white',
                    }}
                    {...focusHandlers(isLoading || isFree)}
                  />
                  <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#6b7280' }}>
                    Disabled when the league is marked as free.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Season Timeline
              </h2>
              <div
                style={{
                  display: 'grid',
                  gap: '1.5rem',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {['startDate', 'endDate', 'registrationOpens', 'registrationCloses'].map(
                  (field) => (
                    <div key={field}>
                      <label
                        htmlFor={field}
                        style={{
                          display: 'block',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {{
                          startDate: 'Season Starts',
                          endDate: 'Season Ends',
                          registrationOpens: 'Registration Opens',
                          registrationCloses: 'Registration Closes',
                        }[field as keyof Record<string, string>]}
                      </label>
                      <input
                        type="date"
                        name={field}
                        id={field}
                        required
                        disabled={isLoading}
                        style={baseInputStyle}
                        {...focusHandlers(isLoading)}
                      />
                    </div>
                  )
                )}
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Holiday Blackouts
              </h2>
              <div
                style={{
                  maxWidth: '28rem',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center' }}>
                  List any dates to skip when generating the schedule. Enter one date per line or
                  separate with commas.
                </p>
                <textarea
                  name="blackoutDates"
                  id="blackoutDates"
                  placeholder={`2024-11-28\n2024-12-24`}
                  rows={4}
                  disabled={isLoading}
                  style={{ ...baseInputStyle, resize: 'vertical', minHeight: '7rem' }}
                  {...focusHandlers(isLoading)}
                />
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center' }}>
                  Use the YYYY-MM-DD format. Leave blank if no blackout dates are needed.
                </p>
              </div>
            </section>

            <section>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                Skill Divisions
              </h2>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  marginBottom: '0.75rem',
                  textAlign: 'center',
                }}
              >
                Select at least one division. You can choose multiple options.
              </p>
              <div
                style={{
                  display: 'grid',
                  gap: '0.75rem',
                  maxWidth: '28rem',
                  margin: '0 auto',
                }}
              >
                {[
                  { value: 'A', label: 'Division A (Advanced)' },
                  { value: 'B', label: 'Division B (Intermediate)' },
                  { value: 'C', label: 'Division C (Beginner)' },
                  { value: 'D', label: 'Division D (Novice)' },
                ].map((division) => (
                  <label
                    key={division.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.95rem',
                      color: '#374151',
                    }}
                  >
                    <input
                      type="checkbox"
                      name="divisions"
                      value={division.value}
                      defaultChecked={division.value === 'C'}
                      disabled={isLoading}
                      style={{ width: '1.1rem', height: '1.1rem' }}
                    />
                    <span>{division.label}</span>
                  </label>
                ))}
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
                disabled={isLoading}
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: isLoading ? '#4b5563' : '#1f2937',
                  border: '1px solid ' + (isLoading ? '#4b5563' : '#1f2937'),
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#111827';
                    e.currentTarget.style.borderColor = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isLoading ? '#4b5563' : '#1f2937';
                  e.currentTarget.style.borderColor = isLoading ? '#4b5563' : '#1f2937';
                }}
              >
                {isLoading ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
