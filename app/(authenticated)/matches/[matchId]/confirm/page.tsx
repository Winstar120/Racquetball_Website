'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  games: Array<{
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    player3Score?: number;
  }>;
  scoreReportedBy?: string;
  player1Confirmed: boolean;
  player2Confirmed: boolean;
  player3Confirmed?: boolean;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number;
}

export default function ConfirmScore({ params }: { params: Promise<{ matchId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState<string>('');
  const [showDispute, setShowDispute] = useState(false);
  const [disputedGames, setDisputedGames] = useState<Game[]>([]);
  const [isDisputing, setIsDisputing] = useState(false);

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

      // Initialize disputed games with the reported scores
      if (data.match.games) {
        setDisputedGames(data.match.games.map((game: any) => ({
          gameNumber: game.gameNumber,
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          player3Score: game.player3Score
        })));
      }
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmScore() {
    setIsConfirming(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to confirm score');
      }

      // Redirect back to matches
      router.push('/matches');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm score');
      setIsConfirming(false);
    }
  }

  function updateDisputedScore(gameIndex: number, player: string, value: string) {
    const score = value === '' ? 0 : parseInt(value) || 0;
    const maxScore = match?.league.pointsToWin || 15;
    const finalScore = Math.min(Math.max(0, score), maxScore);

    const updatedGames = [...disputedGames];
    if (player === 'player1') {
      updatedGames[gameIndex].player1Score = finalScore;
    } else if (player === 'player2') {
      updatedGames[gameIndex].player2Score = finalScore;
    } else if (player === 'player3') {
      updatedGames[gameIndex].player3Score = finalScore;
    }
    setDisputedGames(updatedGames);
  }

  async function submitDispute() {
    setIsDisputing(true);
    setError('');

    try {
      const response = await fetch(`/api/matches/${matchId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ games: disputedGames }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit dispute');
      }

      // Redirect back to matches
      router.push('/matches');
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute');
      setIsDisputing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading match details...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-red-600">Match not found</p>
            <Link href="/matches" className="mt-4 text-blue-600 hover:text-blue-800">
              Back to Matches
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  const isPlayer1 = match.player1.id === currentUserId;
  const isPlayer2 = match.player2.id === currentUserId;
  const isPlayer3 = match.player3?.id === currentUserId;
  const isParticipant = isPlayer1 || isPlayer2 || isPlayer3;

  const alreadyConfirmed = (isPlayer1 && match.player1Confirmed) ||
                          (isPlayer2 && match.player2Confirmed) ||
                          (isPlayer3 && match.player3Confirmed);

  const isCutthroat = match.league.gameType === 'CUTTHROAT';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center">
                <li className="flex items-center">
                  <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    Dashboard
                  </Link>
                  <span className="mx-2 text-gray-400">/</span>
                </li>
                <li className="flex items-center">
                  <Link href="/matches" className="text-gray-400 hover:text-gray-500">
                    Matches
                  </Link>
                  <span className="mx-2 text-gray-400">/</span>
                </li>
                <li>
                  <span className="text-gray-900">Confirm Score</span>
                </li>
              </ol>
            </nav>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Confirm Match Score</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {!isParticipant ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You are not a participant in this match.</p>
              <Link href="/matches" className="text-blue-600 hover:text-blue-800">
                Back to Matches
              </Link>
            </div>
          ) : alreadyConfirmed ? (
            <div className="text-center py-8">
              <p className="text-green-600 mb-4">You have already confirmed this score.</p>
              <Link href="/matches" className="text-blue-600 hover:text-blue-800">
                Back to Matches
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Match Details</h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-500">League</dt>
                    <dd className="text-gray-900">{match.league.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Players</dt>
                    <dd className="text-gray-900">
                      {match.player1.name} vs {match.player2.name}
                      {match.player3 && ` vs ${match.player3.name}`}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reported Scores</h3>
                <div className="space-y-2">
                  {match.games.map((game, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                      <span className="font-medium">Game {index + 1}:</span>
                      <span>
                        {match.player1.name}: {game.player1Score}
                      </span>
                      <span>
                        {match.player2.name}: {game.player2Score}
                      </span>
                      {isCutthroat && match.player3 && (
                        <span>
                          {match.player3.name}: {game.player3Score || 0}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {match.scoreReportedBy && (
                  <p className="mt-4 text-sm text-gray-600">
                    Reported by: {
                      match.scoreReportedBy === match.player1.id ? match.player1.name :
                      match.scoreReportedBy === match.player2.id ? match.player2.name :
                      match.player3?.id === match.scoreReportedBy ? match.player3.name :
                      'Unknown'
                    }
                  </p>
                )}
              </div>

              {!showDispute ? (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      By confirming, you agree that these scores are accurate.
                    </p>
                    <div className="space-x-3">
                      <Link
                        href="/matches"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </Link>
                      <button
                        onClick={() => setShowDispute(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                      >
                        Dispute Score
                      </button>
                      <button
                        onClick={confirmScore}
                        disabled={isConfirming}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {isConfirming ? 'Confirming...' : 'Confirm Score'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Correct Scores</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please enter what you believe are the correct scores. Both players will be notified of the discrepancy.
                    </p>
                    <div className="space-y-4">
                      {disputedGames.map((game, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Game {index + 1}</h4>
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
                                onChange={(e) => updateDisputedScore(index, 'player1', e.target.value)}
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
                                onChange={(e) => updateDisputedScore(index, 'player2', e.target.value)}
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
                                  onChange={(e) => updateDisputedScore(index, 'player3', e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => setShowDispute(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <div className="space-x-3">
                      <Link
                        href="/matches"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </Link>
                      <button
                        onClick={submitDispute}
                        disabled={isDisputing}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDisputing ? 'Submitting...' : 'Submit Dispute'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}