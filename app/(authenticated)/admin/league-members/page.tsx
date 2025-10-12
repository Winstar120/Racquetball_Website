'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  status: string;
}

interface Division {
  id: string;
  name: string;
  level: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skillLevel: string | null;
}

interface Registration {
  id: string;
  user: User;
  division: Division;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface LeagueWithRegistrations extends League {
  registrations: Registration[];
  divisions: Division[];
}

export default function LeagueMembers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leagues, setLeagues] = useState<LeagueWithRegistrations[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchLeaguesWithMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.isAdmin, router]);

  async function fetchLeaguesWithMembers() {
    try {
      const response = await fetch('/api/admin/league-members', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = (payload as any).error ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }
      const data = await response.json();
      setLeagues(data.leagues || []);
      setMessage('');
      if (data.leagues?.length > 0 && !selectedLeague) {
        setSelectedLeague(data.leagues[0].id);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to load league members');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(registrationId: string, userName: string) {
    if (!confirm(`Are you sure you want to remove ${userName} from this league?`)) {
      return;
    }

    setDeleting(registrationId);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/league-members/${registrationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setMessage(`Successfully removed ${userName} from the league`);
      await fetchLeaguesWithMembers();
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  }

  const currentLeague = leagues.find(l => l.id === selectedLeague);

  const filteredRegistrations = currentLeague?.registrations.filter(reg => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      reg.user.name.toLowerCase().includes(term) ||
      reg.user.email.toLowerCase().includes(term) ||
      reg.division.name.toLowerCase().includes(term)
    );
  }) || [];

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
                    }}>League Members</span>
                  </li>
                </ol>
              </nav>
              <h1 style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif'
              }}>League Members Management</h1>
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
              backgroundColor: message.toLowerCase().startsWith('successfully') ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${message.toLowerCase().startsWith('successfully') ? '#86efac' : '#fecaca'}`,
              color: message.toLowerCase().startsWith('successfully') ? '#065f46' : '#991b1b',
              borderRadius: '0.375rem',
            }}
          >
            {message}
          </div>
        )}

        {leagues.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            textAlign: 'center',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#6b7280' }}>No leagues found</p>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
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
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  >
                    {leagues.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name} ({league.registrations.length} members)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Search Members
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or division..."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {currentLeague && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {currentLeague.name} - Member List
                  </h2>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.25rem'
                  }}>
                    Total: {filteredRegistrations.length} member(s)
                  </p>
                </div>

                {filteredRegistrations.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    {searchTerm ? 'No members found matching your search' : 'No members registered for this league'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      fontSize: '0.875rem'
                    }}>
                      <thead style={{
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <tr>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Name
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Email
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Phone
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Division
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Payment Status
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Joined
                          </th>
                          <th style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map((registration, index) => (
                          <tr
                            key={registration.id}
                            style={{
                              borderBottom: index < filteredRegistrations.length - 1 ? '1px solid #e5e7eb' : 'none'
                            }}
                          >
                            <td style={{
                              padding: '1rem 1.5rem',
                              color: '#111827',
                              fontWeight: '500'
                            }}>
                              {registration.user.name}
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              color: '#6b7280'
                            }}>
                              {registration.user.email}
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              color: '#6b7280'
                            }}>
                              {registration.user.phone || '-'}
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem'
                            }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {registration.division.name}
                              </span>
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem'
                            }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: registration.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                                color: registration.paymentStatus === 'PAID' ? '#065f46' : '#92400e',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                {registration.paymentStatus}
                              </span>
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              color: '#6b7280',
                              fontSize: '0.875rem'
                            }}>
                              {new Date(registration.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{
                              padding: '1rem 1.5rem',
                              textAlign: 'center'
                            }}>
                              <button
                                onClick={() => handleRemoveMember(registration.id, registration.user.name)}
                                disabled={deleting === registration.id}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: deleting === registration.id ? '#9ca3af' : '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  cursor: deleting === registration.id ? 'not-allowed' : 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  if (deleting !== registration.id) {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (deleting !== registration.id) {
                                    e.currentTarget.style.backgroundColor = '#ef4444';
                                  }
                                }}
                              >
                                {deleting === registration.id ? 'Removing...' : 'Remove'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
