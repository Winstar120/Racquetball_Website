'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatGameType } from '@/lib/utils';

interface Match {
  id: string;
  scheduledTime: string;
  league: {
    name: string;
    gameType: string;
    pointsToWin: number;
    winByTwo: boolean;
  };
  player1: {
    id: string;
    name: string;
  };
  player2: {
    id: string;
    name: string;
  };
  player3?: {
    id: string;
    name: string;
  };
  court?: {
    name: string;
  };
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
}

export default function ReportScore({ params }: { params: Promise<{ matchId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  // Default to 3 games (standard racquetball match)
  const [games, setGames] = useState<Game[]>([
    { gameNumber: 1, player1Score: 0, player2Score: 0 },
    { gameNumber: 2, player1Score: 0, player2Score: 0 },
    { gameNumber: 3, player1Score: 0, player2Score: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState<string>('');

  useEffect(() => {
    params.then(p => setMatchId(p.matchId));
  }, [params]);

  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  async function fetchMatch() {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      const data = await response.json();
      setMatch(data.match);

      // Initialize games for cut-throat (3 games standard)
      if (data.match.league.gameType === 'CUTTHROAT') {
        setGames([
          { gameNumber: 1, player1Score: 0, player2Score: 0, player3Score: 0 },
          { gameNumber: 2, player1Score: 0, player2Score: 0, player3Score: 0 },
          { gameNumber: 3, player1Score: 0, player2Score: 0, player3Score: 0 }
        ]);
      } else {
        // Regular singles/doubles - also 3 games
        setGames([
          { gameNumber: 1, player1Score: 0, player2Score: 0 },
          { gameNumber: 2, player1Score: 0, player2Score: 0 },
          { gameNumber: 3, player1Score: 0, player2Score: 0 }
        ]);
      }
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  }

  // Removed add/remove game functions - fixed at 3 games

  function updateScore(gameIndex: number, player: string, value: string) {
    // Allow empty string for backspace/delete
    const score = value === '' ? 0 : parseInt(value) || 0;

    // Enforce the league's score limit
    const maxScore = match?.league.pointsToWin || 15;
    const finalScore = Math.min(Math.max(0, score), maxScore);

    const updatedGames = [...games];
    if (player === 'player1') {
      updatedGames[gameIndex].player1Score = finalScore;
    } else if (player === 'player2') {
      updatedGames[gameIndex].player2Score = finalScore;
    } else if (player === 'player3') {
      updatedGames[gameIndex].player3Score = finalScore;
    }
    setGames(updatedGames);
  }

  async function submitScores() {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit scores');
      }

      router.push('/matches');
    } catch (err: any) {
      setError(err.message || 'Failed to submit scores');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading match details...</div>
      </div>
    );
  }

  const isCutthroat = match.league.gameType === 'CUTTHROAT';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center">
                <li>
                  <Link href="/matches" className="text-gray-500 hover:text-gray-700">
                    Matches<span className="mx-2 text-gray-400">/</span>
                  </Link>
                </li>
                <li>
                  <span className="text-gray-900 font-medium">Report Score</span>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Report Match Score</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Match Details</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">League</dt>
                <dd className="text-gray-900">{match.league.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Game Type</dt>
                <dd className="text-gray-900">{formatGameType(match.league.gameType)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Players</dt>
                <dd className="text-gray-900">
                  {match.player1.name} vs {match.player2.name}
                  {match.player3 && ` vs ${match.player3.name}`}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Game Rules</dt>
                <dd className="text-gray-900">
                  First to {match.league.pointsToWin} points
                  {match.league.winByTwo && ', win by 2'}
                </dd>
              </div>
            </dl>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Game Scores</h3>

            {games.map((game, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="mb-3">
                  <h4 className="font-medium">Game {index + 1}</h4>
                </div>

                <div className={`grid ${isCutthroat ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {match.player1.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={match.league.pointsToWin || 15}
                      value={game.player1Score !== undefined ? game.player1Score : ''}
                      onChange={(e) => updateScore(index, 'player1', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {match.player2.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={match.league.pointsToWin || 15}
                      value={game.player2Score !== undefined ? game.player2Score : ''}
                      onChange={(e) => updateScore(index, 'player2', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {isCutthroat && match.player3 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {match.player3.name}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={match.league.pointsToWin || 15}
                        value={game.player3Score !== undefined ? game.player3Score : ''}
                        onChange={(e) => updateScore(index, 'player3', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Link
              href="/matches"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={submitScores}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Submitting...' : 'Submit Scores'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> After submitting, your opponent will need to confirm the scores.
              Both players must confirm for the match to be marked as complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}