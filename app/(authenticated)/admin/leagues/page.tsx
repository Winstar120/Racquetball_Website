'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatGameType } from '@/lib/utils';

interface League {
  id: string;
  name: string;
  gameType: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationOpens: string;
  registrationCloses: string;
  divisions: { id: string; level: string; name: string }[];
  _count: { registrations: number };
}

export default function ManageLeaguesPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/admin/leagues');
      if (!response.ok) throw new Error('Failed to fetch leagues');
      const data = await response.json();
      setLeagues(data.leagues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      UPCOMING: 'bg-gray-100 text-gray-800',
      REGISTRATION_OPEN: 'bg-green-100 text-green-800',
      REGISTRATION_CLOSED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', fontFamily: 'var(--font-playfair), Georgia, serif' }}>Manage Leagues</h1>
              <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>Create and manage league seasons</p>
            </div>
            <Link
              href="/admin/leagues/create"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1f2937',
                color: 'white',
                borderRadius: '0',
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'inline-block'
              }}
            >
              Create New League
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>

        {error && (
          <div style={{
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '0'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '0', padding: '1.5rem' }}>
            <p style={{ color: '#6b7280' }}>Loading leagues...</p>
          </div>
        ) : leagues.length === 0 ? (
          <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '0', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No leagues created yet</p>
            <Link
              href="/admin/leagues/create"
              style={{ color: '#2563eb', textDecoration: 'none' }}
            >
              Create your first league
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '0', overflow: 'hidden' }}>
            <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  League Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Divisions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Players
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leagues.map((league) => (
                <tr key={league.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{league.name}</div>
                    <div className="text-xs text-gray-500">
                      Reg: {new Date(league.registrationOpens).toLocaleDateString()} - {new Date(league.registrationCloses).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatGameType(league.gameType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(league.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {league.divisions.map(d => d.level).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {league._count.registrations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(league.startDate).toLocaleDateString()} - {new Date(league.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/leagues/${league.id}/schedule`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Schedule
                    </Link>
                    <Link
                      href={`/admin/leagues/${league.id}/registrations`}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Registrations
                    </Link>
                    <Link
                      href={`/admin/leagues/${league.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}