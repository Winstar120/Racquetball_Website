import { useState, useEffect } from 'react';

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
  games: any[];
}

interface MatchEditModalProps {
  match: Match;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MatchEditModal({ match, onClose, onSuccess }: MatchEditModalProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    courtId: match.court?.id || '',
    scheduledTime: new Date(match.scheduledTime).toISOString().slice(0, 16),
    weekNumber: match.weekNumber,
    status: match.status
  });

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts');
      const data = await response.json();
      setCourts(data.courts || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          updates: {
            courtId: formData.courtId || null,
            scheduledTime: new Date(formData.scheduledTime),
            weekNumber: formData.weekNumber,
            status: formData.status
          }
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update match');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match');
    } finally {
      setLoading(false);
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827'
          }}>Edit Match</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Match Details
            </h3>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>League:</strong> {match.league.name}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Type:</strong> {formatGameType(match.league.gameType)}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Players:</strong>
                <div style={{ marginTop: '0.25rem' }}>
                  {match.player1.name} vs {match.player2.name}
                  {match.player3 && (
                    <>
                      {match.league.gameType === 'CUTTHROAT'
                        ? ` vs ${match.player3.name}`
                        : match.player4
                          ? ` | ${match.player3.name} & ${match.player4.name}`
                          : ` | ${match.player3.name}`
                      }
                    </>
                  )}
                </div>
              </div>
              <div>
                <strong>Games Played:</strong> {match.games.length}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
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
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Court
            </label>
            <select
              value={formData.courtId}
              onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">TBD</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Week Number
            </label>
            <input
              type="number"
              min="1"
              value={formData.weekNumber}
              onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Updating...' : 'Update Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}