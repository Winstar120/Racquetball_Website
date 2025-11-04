'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Match {
  id: string;
  scheduledTime: string;
  player1: {
    name: string;
    email: string;
    emailNotifications: boolean;
  };
  player2: {
    name: string;
    email: string;
    emailNotifications: boolean;
  };
  court?: {
    name: string;
  };
  league: {
    name: string;
  };
}

export default function NotificationsAdmin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [daysAhead, setDaysAhead] = useState('1');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function previewMatches() {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/notifications?daysAhead=${daysAhead}`);
      if (!response.ok) throw new Error('Failed to fetch matches');

      const data = await response.json();
      setMatches(data.matches || []);

      if (data.matches.length === 0) {
        setMessage('No matches scheduled in the selected time range.');
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
      setError('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  }

  async function sendNotifications() {
    if (!confirm(`Are you sure you want to send notifications for ${matches.length} matches?`)) {
      return;
    }

    setIsSending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead: parseInt(daysAhead) }),
      });

      if (!response.ok) throw new Error('Failed to send notifications');

      const data = await response.json();
      setMessage(`${data.message}. ${data.successCount} emails sent successfully, ${data.failureCount} failed.`);
      setMatches([]);
    } catch (error) {
      console.error('Failed to send notifications:', error);
      setError('Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center">
                <li>
                  <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                    Admin<span className="mx-2 text-gray-400">/</span>
                  </Link>
                </li>
                <li>
                  <span className="text-gray-900 font-medium">Match Notifications</span>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Send Match Reminders</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Email Notification Settings</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Match reminders include opponent contact information (name, email, and phone number)
                to allow players to coordinate directly.
              </p>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label htmlFor="daysAhead" className="block text-sm font-medium text-gray-700 mb-1">
                  Send reminders for matches within
                </label>
                <select
                  id="daysAhead"
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="1">Next 24 hours</option>
                  <option value="2">Next 2 days</option>
                  <option value="3">Next 3 days</option>
                  <option value="7">Next week</option>
                </select>
              </div>
              <button
                onClick={previewMatches}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Preview Matches'}
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          {matches.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {matches.length} Upcoming Matches
                </h3>
                <button
                  onClick={sendNotifications}
                  disabled={isSending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : `Send ${matches.length * 2} Reminders`}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        League
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Court
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player 1
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player 2
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matches.map((match) => (
                      <tr key={match.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(match.scheduledTime)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {match.league.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {match.court?.name || 'TBD'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div>
                            <div className="text-gray-900">{match.player1.name}</div>
                            <div className="text-gray-500 text-xs">{match.player1.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div>
                            <div className="text-gray-900">{match.player2.name}</div>
                            <div className="text-gray-500 text-xs">{match.player2.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              match.player1.emailNotifications
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              P1: {match.player1.emailNotifications ? 'Yes' : 'No'}
                            </span>
                            <br />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              match.player2.emailNotifications
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              P2: {match.player2.emailNotifications ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  * Reminders will only be sent to players who have email notifications enabled.
                </p>
                <p>
                  * Each player receives their opponent&rsquo;s contact information (name, email, and phone number).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
