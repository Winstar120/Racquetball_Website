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
}

export default function AdminEmails() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [session, router]);

  async function fetchData() {
    try {
      // Fetch leagues
      const leaguesRes = await fetch('/api/leagues');
      const leaguesData = await leaguesRes.json();
      setLeagues(leaguesData.leagues || []);

      // Fetch upcoming matches
      const matchesRes = await fetch('/api/matches?status=SCHEDULED&limit=10');
      const matchesData = await matchesRes.json();
      setUpcomingMatches(matchesData.matches || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMatchReminder(matchId: string) {
    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/email/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(` Match reminders sent successfully`);
      } else {
        setMessage(` Failed to send reminders: ${data.error}`);
      }
    } catch (error) {
      setMessage(' Error sending reminders');
    } finally {
      setSending(false);
    }
  }

  async function sendAnnouncement() {
    if (!selectedLeague || !announcementSubject || !announcementMessage) {
      setMessage(' Please fill in all fields');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/email/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeague,
          subject: announcementSubject,
          message: announcementMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(` Announcement sent to ${data.successful} recipients`);
        setAnnouncementSubject('');
        setAnnouncementMessage('');
        setSelectedLeague('');
      } else {
        setMessage(` Failed to send announcement: ${data.error}`);
      }
    } catch (error) {
      setMessage(' Error sending announcement');
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
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: message.startsWith('') ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${message.startsWith('') ? '#86efac' : '#fecaca'}`,
            color: message.startsWith('') ? '#065f46' : '#991b1b',
            borderRadius: '0.375rem'
          }}>
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
                  </div>
                ))
              )}
            </div>
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
            <li>EMAIL_HOST (e.g., smtp.gmail.com)</li>
            <li>EMAIL_PORT (e.g., 587)</li>
            <li>EMAIL_USER (your email address)</li>
            <li>EMAIL_PASSWORD (your email password or app-specific password)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}