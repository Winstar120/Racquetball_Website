'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import MatchScheduleModal from '@/components/admin/MatchScheduleModal';
import MatchEditModal from '@/components/admin/MatchEditModal';

interface Player {
  id: string;
  name: string;
  email: string;
}

interface Court {
  id: string;
  name: string;
}

interface League {
  id: string;
  name: string;
  gameType: string;
}

interface Game {
  id: string;
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
  player4Score?: number;
}

interface Match {
  id: string;
  leagueId: string;
  league: League;
  player1: Player;
  player2: Player;
  player3?: Player;
  player4?: Player;
  court?: Court;
  scheduledTime: string;
  weekNumber: number;
  status: string;
  games: Game[];
}

export default function AdminMatchesPage() {
  const { data: session, status } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && (!session || !session.user.isAdmin)) {
      redirect('/dashboard');
    }
  }, [session, status]);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedLeague !== 'all') params.append('leagueId', selectedLeague);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/matches?${params.toString()}`);
      const data = (await response.json()) as { matches?: Match[]; leagues?: League[] };
      setMatches(data.matches ?? []);
      setLeagues(data.leagues ?? []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedLeague, selectedStatus]);

  useEffect(() => {
    if (session?.user.isAdmin) {
      fetchMatches();
    }
  }, [session, fetchMatches]);

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This will also delete all associated game scores.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/matches?matchId=${matchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMatches();
      } else {
        alert('Failed to delete match');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const formatGameType = (gameType: string): string => {
    switch (gameType) {
      case 'SINGLES': return 'Singles';
      case 'DOUBLES': return 'Doubles';
      case 'CUTTHROAT': return 'Cut-Throat';
      default: return gameType;
    }
  };

  const formatStatus = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (status === 'loading' || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Loading...</div>;
  }

  if (!session?.user.isAdmin) {
    return null;
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'var(--font-playfair), Georgia, serif'
            }}>
              Match Management
            </h1>
            <p style={{
              marginTop: '0.5rem',
              color: '#d1d5db',
              fontSize: '0.875rem'
            }}>
              Schedule and manage matches across all leagues
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            + Schedule New Match
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {/* Filters */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Search Players
            </label>
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              League
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
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Leagues</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  League
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Players
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Type
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Court
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Date/Time
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Week
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Games
                </th>
                <th style={{
                  padding: '1rem',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No matches found
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {match.league.name}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      <div style={{ lineHeight: '1.5' }}>
                        <div>{match.player1.name} vs {match.player2.name}</div>
                        {match.player3 && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {match.league.gameType === 'CUTTHROAT'
                              ? `vs ${match.player3.name}`
                              : match.player4
                                ? `${match.player3.name} & ${match.player4.name}`
                                : match.player3.name
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {formatGameType(match.league.gameType)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {match.court?.name || 'TBD'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(match.scheduledTime).toLocaleDateString()}<br/>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      Week {match.weekNumber}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: `${getStatusColor(match.status)}20`,
                        color: getStatusColor(match.status),
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {formatStatus(match.status)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {match.games.length} played
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          marginRight: '0.5rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {showAddModal && (
      <MatchScheduleModal
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchMatches();
        }}
        leagues={leagues}
      />
    )}

    {showEditModal && selectedMatch && (
      <MatchEditModal
        match={selectedMatch}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMatch(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedMatch(null);
          fetchMatches();
        }}
      />
    )}
    </div>
  </div>
  );
}
