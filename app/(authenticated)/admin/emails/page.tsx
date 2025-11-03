'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  _count: {
    registrations: number;
  };
}

interface Match {
  id: string;
  scheduledTime: string;
  player1: { name: string; email: string };
  player2: { name: string; email: string };
  player3?: { name: string; email: string };
  player4?: { name: string; email: string };
  league: { name: string };
  court?: { name: string | null } | null;
  reminderSentAt?: string | null;
}

interface EmailLogEntry {
  id: string;
  type: 'MATCH_REMINDER' | 'MAKEUP_NOTICE';
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  error?: string | null;
  sentAt: string;
  match?: {
    id: string;
    scheduledTime: string | null;
    isMakeup: boolean;
    league?: { name: string | null } | null;
  } | null;
  recipient: { id: string; name: string; email: string };
}

interface EmailLogSummary {
  pendingUpcomingWeek: number;
  overdue: number;
  sentThisWeek: number;
}

export default function AdminEmails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [logSummary, setLogSummary] = useState<EmailLogSummary | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.isAdmin, router]);

  async function fetchData() {
    try {
      // Fetch leagues
      const leaguesRes = await fetch('/api/leagues', { credentials: 'include', cache: 'no-store' });
      const leaguesData = await leaguesRes.json();
      setLeagues(leaguesData.leagues || []);

      // Fetch upcoming matches
      const matchesRes = await fetch('/api/admin/matches?status=SCHEDULED&limit=10', {
        credentials: 'include',
        cache: 'no-store',
      });
      const matchesData = await matchesRes.json();
      setUpcomingMatches(matchesData.matches || []);
      await refreshLogs();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshLogs() {
    try {
      setLogsLoading(true);
      const response = await fetch('/api/email/logs', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Failed to fetch email logs:', data?.error || response.statusText);
        return;
      }
      const data = await response.json();
      setEmailLogs(data.recentLogs || []);
      setLogSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }

  async function sendMatchReminder(matchId: string, force = false) {
    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matchId, force }),
      });

      const data = await response.json();

      if (response.ok) {
        const { reminderSentAt: sentAt } = data;
        setMessage('Match reminders sent successfully.');
        setMessageType('success');
        if (sentAt) {
          setUpcomingMatches((prev) =>
            prev.map((match) =>
              match.id === matchId ? { ...match, reminderSentAt: sentAt } : match
            )
          );
        }
        await refreshLogs();
      } else {
        setMessage(`Failed to send reminders: ${data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error sending reminders.');
      setMessageType('error');
    } finally {
      setSending(false);
    }
  }

  async function sendAnnouncement() {
    if (!selectedLeague || !announcementSubject || !announcementMessage) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          leagueId: selectedLeague,
          subject: announcementSubject,
          message: announcementMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Announcement sent to ${data.successful} recipients.`);
        setMessageType('success');
        setAnnouncementSubject('');
        setAnnouncementMessage('');
        setSelectedLeague('');
      } else {
        setMessage(`Failed to send announcement: ${data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error sending announcement.');
      setMessageType('error');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh' }}>
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
                    <Link href="/admin" style={{
                      color: '#6b7280',
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}>
                      Admin
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
                    }}>Email Management</span>
                  </li>
                </ol>
              </nav>
              <h1 style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif'
              }}>Email Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {message && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: messageType === 'success' ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${messageType === 'success' ? '#86efac' : '#fecaca'}`,
              color: messageType === 'success' ? '#065f46' : '#991b1b',
              borderRadius: '0.375rem',
            }}
          >
            {message}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Send League Announcement */}
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Send League Announcement
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Select League
              </label>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                disabled={sending}
              >
                <option value="">Choose a league</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league._count.registrations} players)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Subject
              </label>
              <input
                type="text"
                value={announcementSubject}
                onChange={(e) => setAnnouncementSubject(e.target.value)}
                placeholder="Important Update"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                disabled={sending}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Message
              </label>
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Enter your announcement message..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
                disabled={sending}
              />
            </div>

            <button
              onClick={sendAnnouncement}
              disabled={sending || !selectedLeague || !announcementSubject || !announcementMessage}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: sending ? '#9ca3af' : '#3b82f6',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
            >
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>

          {/* Match Reminders */}
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Send Match Reminders
            </h2>

            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Send reminder emails to players for upcoming matches
            </p>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {upcomingMatches.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No upcoming matches</p>
              ) : (
                upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.375rem',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem'
                    }}>
                      <strong>{match.league.name}</strong> - {new Date(match.scheduledTime).toLocaleDateString()}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.75rem'
                    }}>
                      {match.player1.name} vs {match.player2.name}
                      {match.player3 && ` vs ${match.player3.name}`}
                      {match.player4 && ` & ${match.player4.name}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', marginBottom: '0.5rem' }}>
                      {match.reminderSentAt
                        ? `Reminder sent on ${new Date(match.reminderSentAt).toLocaleString()}`
                        : 'Reminder not sent yet'}
                    </div>
                    {match.reminderSentAt ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          disabled
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#9ca3af',
                            color: 'white',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'not-allowed'
                          }}
                        >
                          Reminder Sent
                        </button>
                        <button
                          type="button"
                          onClick={() => sendMatchReminder(match.id, true)}
                          disabled={sending}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: sending ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            border: 'none',
                            cursor: sending ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Resend Anyway
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => sendMatchReminder(match.id)}
                        disabled={sending}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: sending ? '#9ca3af' : '#10b981',
                          color: 'white',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: 'none',
                          cursor: sending ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Send Reminder
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: '#111827'
              }}>
                Reminder Activity
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Track reminder deliveries and outstanding matches.
              </p>
            </div>
            <button
              onClick={refreshLogs}
              disabled={logsLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: logsLoading ? '#9ca3af' : '#1f2937',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                border: 'none',
                cursor: logsLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {[
              { label: 'Pending (This Week)', value: logSummary?.pendingUpcomingWeek ?? 0 },
              { label: 'Overdue Reminders', value: logSummary?.overdue ?? 0 },
              { label: 'Reminders Sent (This Week)', value: logSummary?.sentThisWeek ?? 0 },
            ].map((item) => (
              <div key={item.label} style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {logsLoading ? (
              <p style={{ color: '#6b7280' }}>Loading activity...</p>
            ) : emailLogs.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No reminder activity recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                    {['Sent', 'Recipient', 'Type', 'Status', 'Match', 'Notes'].map((heading) => (
                      <th key={heading} style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => {
                    const matchInfo = log.match
                      ? `${log.match.league?.name ?? 'League'} • ${log.match.isMakeup ? 'Makeup' : 'Scheduled'} • ${
                          log.match.scheduledTime ? new Date(log.match.scheduledTime).toLocaleDateString() : 'TBD'
                        }`
                      : '—';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#111827' }}>
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#111827' }}>
                          <div>{log.recipient.name}</div>
                          <div style={{ color: '#6b7280' }}>{log.recipient.email}</div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#111827' }}>
                          {log.type === 'MATCH_REMINDER' ? 'Match Reminder' : 'Makeup Notice'}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontWeight: 600,
                            backgroundColor:
                              log.status === 'SENT' ? '#dcfce7' : log.status === 'FAILED' ? '#fee2e2' : '#e5e7eb',
                            color:
                              log.status === 'SENT' ? '#166534' : log.status === 'FAILED' ? '#991b1b' : '#374151'
                          }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#111827' }}>
                          {matchInfo}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          {log.error ? `Error: ${log.error}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Email Configuration Info */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '0.375rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#1e40af'
          }}>
            Email Configuration
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            To enable email sending, configure the following environment variables:
          </p>
          <ul style={{
            marginTop: '0.5rem',
            marginLeft: '1.5rem',
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <li>SMTP_HOST (e.g., smtp.gmail.com)</li>
            <li>SMTP_PORT (e.g., 587)</li>
            <li>SMTP_USER (email account username)</li>
            <li>SMTP_PASSWORD (email password or app-specific password)</li>
            <li>SMTP_FROM (optional friendly from address)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
