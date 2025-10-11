'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateLeague() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [gameType, setGameType] = useState('SINGLES');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);

    const leagueData = {
      name: formData.get('name'),
      gameType: formData.get('gameType'),
      rankingMethod: formData.get('rankingMethod'),
      pointsToWin: parseInt(formData.get('pointsToWin') as string),
      winByTwo: formData.get('winByTwo') === 'true',
      isFree: formData.get('isFree') === 'true',
      leagueFee: formData.get('isFree') === 'true' ? 0 : parseFloat(formData.get('leagueFee') as string),
      playersPerMatch: formData.get('gameType') === 'SINGLES' ? 2 : formData.get('gameType') === 'CUTTHROAT' ? 3 : 4,
      matchDuration: parseInt(formData.get('matchDuration') as string),
      weeksForCutthroat: formData.get('gameType') === 'CUTTHROAT' ? parseInt(formData.get('weeksForCutthroat') as string) : null,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      registrationOpens: formData.get('registrationOpens'),
      registrationCloses: formData.get('registrationCloses'),
      divisions: formData.getAll('divisions'),
    };

    try {
      const response = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leagueData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create league');
        return;
      }

      router.push('/admin/leagues');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111827' }}>
      <div className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center list-none p-0 m-0">
                <li className="flex items-center">
                  <Link href="/admin" className="text-gray-400 hover:text-gray-200" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Admin
                  </Link>
                  <span className="mx-2 text-gray-500">/</span>
                </li>
                <li className="flex items-center">
                  <Link href="/admin/leagues" className="text-gray-400 hover:text-gray-200" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Leagues
                  </Link>
                  <span className="mx-2 text-gray-500">/</span>
                </li>
                <li>
                  <span className="text-white font-medium">Create</span>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-white">Create New League</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-xl rounded-lg mx-auto p-8 border border-gray-200" style={{ maxWidth: '800px', backgroundColor: 'white' }}>
          <form onSubmit={onSubmit}>
            {error && (
              <div className="mb-6">
                <div className="rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
                  {error}
                </div>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Basic Information</h2>
            <div className="mx-auto" style={{ maxWidth: '320px' }}>
              <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2">
                League Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-4 py-2.5"
                placeholder="Winter League 2025"
              />
            </div>
          </div>

            {/* Game Settings Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Game Settings</h2>
            <div className="space-y-6 mx-auto" style={{ maxWidth: '640px' }}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="gameType" className="block text-base font-medium text-gray-700 mb-2">
                    Game Type
                  </label>
                  <select
                    name="gameType"
                    id="gameType"
                    required
                    disabled={isLoading}
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                  >
                    <option value="SINGLES">Singles (1v1)</option>
                    <option value="DOUBLES">Doubles (2v2)</option>
                    <option value="CUTTHROAT">Cut-throat (3 players)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rankingMethod" className="block text-base font-medium text-gray-700 mb-2">
                    Ranking Method
                  </label>
                  <select
                    name="rankingMethod"
                    id="rankingMethod"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                  >
                    <option value="BY_WINS">By Wins (Traditional)</option>
                    <option value="BY_POINTS">By Total Points Scored</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose how players are ranked in standings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="pointsToWin" className="block text-base font-medium text-gray-700 mb-2">
                    Points to Win
                  </label>
                  <input
                    type="number"
                    name="pointsToWin"
                    id="pointsToWin"
                    defaultValue="15"
                    min="7"
                    max="21"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                  />
                </div>

                <div>
                  <label htmlFor="winByTwo" className="block text-base font-medium text-gray-700 mb-2">
                    Win by Two
                  </label>
                  <select
                    name="winByTwo"
                    id="winByTwo"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="matchDuration" className="block text-base font-medium text-gray-700 mb-2">
                    Match Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="matchDuration"
                    id="matchDuration"
                    defaultValue="45"
                    min="30"
                    max="120"
                    required
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    Includes 5 minute warmup time
                  </p>
                </div>

                {gameType === 'CUTTHROAT' && (
                  <div>
                    <label htmlFor="weeksForCutthroat" className="block text-base font-medium text-gray-700 mb-2">
                      Number of Weeks
                    </label>
                    <input
                      type="number"
                      name="weeksForCutthroat"
                      id="weeksForCutthroat"
                      defaultValue="8"
                      min="4"
                      max="20"
                      required
                      disabled={isLoading}
                      className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                    />
                    <p className="mt-1 text-sm text-gray-600">
                      Groups will rotate weekly to maximize variety
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Schedule Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Schedule Dates</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mx-auto" style={{ maxWidth: '640px' }}>
              <div>
                <label htmlFor="startDate" className="block text-base font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-base font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                />
              </div>
            </div>
          </div>

            {/* Registration Period Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Registration Period</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mx-auto" style={{ maxWidth: '640px' }}>
              <div>
                <label htmlFor="registrationOpens" className="block text-base font-medium text-gray-700 mb-2">
                  Registration Opens
                </label>
                <input
                  type="datetime-local"
                  name="registrationOpens"
                  id="registrationOpens"
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                />
              </div>

              <div>
                <label htmlFor="registrationCloses" className="block text-base font-medium text-gray-700 mb-2">
                  Registration Closes
                </label>
                <input
                  type="datetime-local"
                  name="registrationCloses"
                  id="registrationCloses"
                  required
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                />
              </div>
            </div>
          </div>

            {/* League Type & Fees Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">League Type & Fees</h2>
            <div className="space-y-4 mx-auto" style={{ maxWidth: '320px' }}>
              <div>
                <label htmlFor="isFree" className="block text-base font-medium text-gray-700 mb-2">
                  League Type
                </label>
                <select
                  name="isFree"
                  id="isFree"
                  required
                  disabled={isLoading}
                  value={isFree ? 'true' : 'false'}
                  onChange={(e) => setIsFree(e.target.value === 'true')}
                  className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                >
                  <option value="true">Free League</option>
                  <option value="false">Paid League</option>
                </select>
                <p className="mt-1 text-sm text-gray-600">
                  Choose whether to track payment status for this league
                </p>
              </div>

              {!isFree && (
                <div>
                  <label htmlFor="leagueFee" className="block text-base font-medium text-gray-700 mb-2">
                    League Fee ($)
                  </label>
                  <input
                    type="number"
                    name="leagueFee"
                    id="leagueFee"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required={!isFree}
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border border-gray-300 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2.5"
                    placeholder="25.00"
                  />
                  <p className="mt-1 text-sm text-gray-600">
                    Enter the fee amount for league registration
                  </p>
                </div>
              )}
            </div>
          </div>

            {/* Skill Divisions Section */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Skill Divisions</h2>
            <div className="mx-auto" style={{ maxWidth: '400px' }}>
                <p className="text-base text-gray-600 mb-3 text-center">
                  Select which skill divisions will be available for this league
                </p>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="divisions"
                    value="A"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-base text-gray-700">Division A (Advanced)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="divisions"
                    value="B"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-base text-gray-700">Division B (Intermediate)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="divisions"
                    value="C"
                    defaultChecked
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-base text-gray-700">Division C (Beginner)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="divisions"
                    value="D"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-base text-gray-700">Division D (Novice)</span>
                </label>
              </div>
            </div>
          </div>

            {/* Form Actions */}
            <div className="py-6 flex justify-center gap-3">
            <Link
              href="/admin/leagues"
              className="px-5 py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}