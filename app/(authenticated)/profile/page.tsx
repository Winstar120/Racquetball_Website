'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ProfileStats = {
  stats?: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: string;
    totalGamesWon: number;
    totalGamesPlayed: number;
    gameWinRate: string;
    totalPointsScored: number;
    totalPointsConceded: number;
    avgPointsPerGame: string;
    pointDifferential: number;
    activeLeagues: number;
  };
};

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skillLevel: 'C',
    emailNotifications: true,
    smsNotifications: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user) {
      // Fetch the complete profile data
      fetchProfile();
      fetchStats();
    }
  }, [status, session, router]);

  async function fetchProfile() {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          skillLevel: data.skillLevel || 'C',
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = (await response.json()) as ProfileStats;
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);

        // Update the session with new name if changed
        if (session && data.user.name !== session.user.name) {
          // Trigger a session update
          router.refresh();
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
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
                    <Link href="/dashboard" style={{
                      color: '#6b7280',
                      textDecoration: 'none',
                      fontSize: '0.875rem'
                    }}>
                      Dashboard
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
                    }}>Profile</span>
                  </li>
                </ol>
              </nav>
              <h1 style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                fontFamily: 'var(--font-playfair), Georgia, serif'
              }}>My Profile</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#1f2937',
                  border: '1px solid #1f2937',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#111827';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1.5rem'
        }}>
          {successMessage && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.25rem',
              color: '#065f46'
            }}>
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.25rem',
              color: '#991b1b'
            }}>
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = '#111827';
                      e.target.style.boxShadow = '0 0 0 1px #111827';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = '#111827';
                      e.target.style.boxShadow = '0 0 0 1px #111827';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = '#111827';
                      e.target.style.boxShadow = '0 0 0 1px #111827';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Skill Level
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                  disabled={!isEditing}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827',
                    backgroundColor: isEditing ? 'white' : '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: isEditing ? 'pointer' : 'default'
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.target.style.borderColor = '#111827';
                      e.target.style.boxShadow = '0 0 0 1px #111827';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="OPEN">Open (Advanced)</option>
                  <option value="A">A (Strong Intermediate)</option>
                  <option value="B">B (Intermediate)</option>
                  <option value="C">C (Advanced Beginner)</option>
                  <option value="D">D (Beginner)</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: isLoading ? '#6b7280' : '#1f2937',
                    border: '1px solid #1f2937',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#111827';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                    }
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        <div style={{
          marginTop: '2rem',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            fontFamily: 'var(--font-playfair), Georgia, serif'
          }}>Account Statistics</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Games Played
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                {isLoadingStats ? '...' : stats?.stats?.totalGamesPlayed || 0}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Game Win Rate
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                {isLoadingStats ? '...' : `${stats?.stats?.gameWinRate || 0}%`}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Points
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                {isLoadingStats ? '...' : stats?.stats?.totalPointsScored || 0}
              </div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Active Leagues
              </div>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827'
              }}>
                {isLoadingStats ? '...' : stats?.stats?.activeLeagues || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
