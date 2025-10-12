'use client';

import { useState, useEffect } from 'react';
import AdminPageLayout from '@/components/admin/AdminPageLayout';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  skillLevel?: string;
  phoneNumber?: string;
  createdAt: string;
  leagues: {
    id: string;
    name: string;
    division: string;
    status: string;
  }[];
  totalMatches: number;
  activeLeagues: number;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user =>
        roleFilter === 'admin' ? user.isAdmin : !user.isAdmin
      );
    }

    setFilteredUsers(filtered);
  }

  async function handleToggleAdmin(userId: string, currentStatus: boolean) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          updates: { isAdmin: !currentStatus }
        })
      });

      if (!response.ok) throw new Error('Failed to update user');

      await fetchUsers();
    } catch (error) {
      alert('Failed to update user role');
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      await fetchUsers();
    } catch (error) {
      alert('Failed to delete user');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return (
    <AdminPageLayout
      title="Manage Users"
      subtitle={`${users.length} total users • ${users.filter(u => u.isAdmin).length} admins`}
    >
      {isLoading ? (
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          Loading users...
        </div>
      ) : (
        <>
          <div style={{
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#111827',
                borderRadius: '0',
                minWidth: '250px',
                flex: '1'
              }}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#111827',
                borderRadius: '0',
                minWidth: '150px'
              }}
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
            </select>
          </div>

          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            borderRadius: '0',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Leagues
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Matches
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Joined
                  </th>
                  <th style={{
                    padding: '0.75rem 1.5rem',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white' }}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '2rem 1.5rem',
                      textAlign: 'center',
                      color: '#6b7280'
                    }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} style={{
                      borderTop: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {user.name}
                          </div>
                          {user.skillLevel && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                              Skill: {user.skillLevel}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        {user.isAdmin ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.125rem 0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '0.25rem'
                          }}>
                            Admin
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.125rem 0.625rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            borderRadius: '0.25rem'
                          }}>
                            User
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {user.activeLeagues}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {user.totalMatches}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetails(true);
                            }}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                              color: '#2563eb',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                              color: '#d97706',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.875rem',
                              color: '#dc2626',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Details Modal */}
          {showDetails && selectedUser && (
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
              zIndex: 50
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                maxWidth: '32rem',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    User Details
                  </h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    style={{
                      color: '#6b7280',
                      fontSize: '1.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Personal Information
                    </h3>
                    <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
                      <p><strong>Name:</strong> {selectedUser.name}</p>
                      <p><strong>Email:</strong> {selectedUser.email}</p>
                      {selectedUser.phoneNumber && <p><strong>Phone:</strong> {selectedUser.phoneNumber}</p>}
                      {selectedUser.skillLevel && <p><strong>Skill Level:</strong> {selectedUser.skillLevel}</p>}
                      <p><strong>Role:</strong> {selectedUser.isAdmin ? 'Administrator' : 'Regular User'}</p>
                      <p><strong>Member Since:</strong> {formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                      League Participation
                    </h3>
                    <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
                      {selectedUser.leagues.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>Not registered in any leagues</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {selectedUser.leagues.map((league) => (
                            <div key={league.id} style={{
                              paddingTop: '0.5rem',
                              paddingBottom: '0.5rem',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <p style={{ fontWeight: '500' }}>{league.name}</p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Division: {league.division} • Status: {league.status}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                      Statistics
                    </h3>
                    <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
                      <p><strong>Total Matches Played:</strong> {selectedUser.totalMatches}</p>
                      <p><strong>Active Leagues:</strong> {selectedUser.activeLeagues}</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowDetails(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminPageLayout>
  );
}
