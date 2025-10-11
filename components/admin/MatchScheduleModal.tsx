import { useState, useEffect } from 'react';

interface League {
  id: string;
  name: string;
  gameType: string;
}

interface Player {
  id: string;
  name: string;
  email: string;
}

interface Court {
  id: string;
  name: string;
}

interface MatchScheduleModalProps {
  onClose: () => void;
  onSuccess: () => void;
  leagues: League[];
}

export default function MatchScheduleModal({ onClose, onSuccess, leagues }: MatchScheduleModalProps) {
  const [selectedLeague, setSelectedLeague] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    player1Id: '',
    player2Id: '',
    player3Id: '',
    player4Id: '',
    courtId: '',
    scheduledTime: '',
    weekNumber: 1
  });

  useEffect(() => {
    fetchPlayers();
    fetchCourts();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setPlayers(data.users || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts');
      const data = await response.json();
      setCourts(data.courts || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const selectedLeagueData = leagues.find(l => l.id === selectedLeague);
  const gameType = selectedLeagueData?.gameType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLeague || !formData.player1Id || !formData.player2Id || !formData.scheduledTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (gameType === 'CUTTHROAT' && !formData.player3Id) {
      alert('Cut-throat matches require 3 players');
      return;
    }

    if (gameType === 'DOUBLES' && (!formData.player3Id || !formData.player4Id)) {
      alert('Doubles matches require 4 players');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeague,
          player1Id: formData.player1Id,
          player2Id: formData.player2Id,
          player3Id: formData.player3Id || null,
          player4Id: formData.player4Id || null,
          courtId: formData.courtId || null,
          scheduledTime: formData.scheduledTime,
          weekNumber: formData.weekNumber
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to schedule match');
      }
    } catch (error) {
      console.error('Error scheduling match:', error);
      alert('Failed to schedule match');
    } finally {
      setLoading(false);
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
          }}>Schedule New Match</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              League *
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
              required
            >
              <option value="">Select a league</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.gameType === 'SINGLES' ? 'Singles' : league.gameType === 'DOUBLES' ? 'Doubles' : 'Cut-Throat'})
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
              Player 1 *
            </label>
            <select
              value={formData.player1Id}
              onChange={(e) => setFormData({ ...formData, player1Id: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              required
            >
              <option value="">Select player 1</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
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
              Player 2 *
            </label>
            <select
              value={formData.player2Id}
              onChange={(e) => setFormData({ ...formData, player2Id: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
              required
            >
              <option value="">Select player 2</option>
              {players.filter(p => p.id !== formData.player1Id).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {(gameType === 'CUTTHROAT' || gameType === 'DOUBLES') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#374151'
              }}>
                Player 3 {gameType === 'CUTTHROAT' || gameType === 'DOUBLES' ? '*' : ''}
              </label>
              <select
                value={formData.player3Id}
                onChange={(e) => setFormData({ ...formData, player3Id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                required={gameType === 'CUTTHROAT' || gameType === 'DOUBLES'}
              >
                <option value="">Select player 3</option>
                {players.filter(p => p.id !== formData.player1Id && p.id !== formData.player2Id).map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {gameType === 'DOUBLES' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#374151'
              }}>
                Player 4 *
              </label>
              <select
                value={formData.player4Id}
                onChange={(e) => setFormData({ ...formData, player4Id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                required
              >
                <option value="">Select player 4</option>
                {players.filter(p =>
                  p.id !== formData.player1Id &&
                  p.id !== formData.player2Id &&
                  p.id !== formData.player3Id
                ).map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Date & Time *
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
              {loading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}