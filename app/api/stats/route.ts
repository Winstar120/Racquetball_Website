import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all completed matches for the user
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
          { player3Id: userId },
        ],
        status: {
          in: ['IN_PROGRESS', 'COMPLETED', 'DISPUTED'],
        },
      },
      include: {
        games: true,
        league: true,
        player1: true,
        player2: true,
        player3: true,
      },
    });

    // Calculate statistics
    const totalMatches = matches.length;
    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesPlayed = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    matches.forEach(match => {
      const isPlayer1 = match.player1Id === userId;
      const isPlayer2 = match.player2Id === userId;
      const isPlayer3 = match.player3Id === userId;

      // Count games won/lost for this match
      let gamesWonInMatch = 0;
      let gamesLostInMatch = 0;

      match.games.forEach(game => {
        totalGamesPlayed++;

        if (match.league.gameType === 'CUTTHROAT') {
          // For cutthroat, determine winner by highest score
          const scores = [
            { playerId: match.player1Id, score: game.player1Score },
            { playerId: match.player2Id, score: game.player2Score },
            { playerId: match.player3Id, score: game.player3Score || 0 },
          ];
          scores.sort((a, b) => b.score - a.score);

          if (scores[0].playerId === userId) {
            gamesWonInMatch++;
            totalGamesWon++;
          } else {
            gamesLostInMatch++;
          }

          // Add points
          if (isPlayer1) {
            totalPointsScored += game.player1Score;
            totalPointsConceded += game.player2Score + (game.player3Score || 0);
          } else if (isPlayer2) {
            totalPointsScored += game.player2Score;
            totalPointsConceded += game.player1Score + (game.player3Score || 0);
          } else if (isPlayer3) {
            totalPointsScored += game.player3Score || 0;
            totalPointsConceded += game.player1Score + game.player2Score;
          }
        } else {
          // For singles/doubles
          let userScore = 0;
          let opponentScore = 0;

          if (isPlayer1) {
            userScore = game.player1Score;
            opponentScore = game.player2Score;
          } else if (isPlayer2) {
            userScore = game.player2Score;
            opponentScore = game.player1Score;
          }

          if (userScore > opponentScore) {
            gamesWonInMatch++;
            totalGamesWon++;
          } else {
            gamesLostInMatch++;
          }

          totalPointsScored += userScore;
          totalPointsConceded += opponentScore;
        }
      });

      // Determine match winner (best of 3)
      if (gamesWonInMatch > gamesLostInMatch) {
        wins++;
      } else {
        losses++;
      }
    });

    const winRate = totalMatches > 0 ? (wins / totalMatches * 100).toFixed(1) : '0';
    const gameWinRate = totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed * 100).toFixed(1) : '0';
    const avgPointsPerGame = totalGamesPlayed > 0 ? (totalPointsScored / totalGamesPlayed).toFixed(1) : '0';
    const pointDifferential = totalPointsScored - totalPointsConceded;

    // Get current league registrations
    const currentRegistrations = await prisma.leagueRegistration.findMany({
      where: {
        userId: userId,
        status: 'CONFIRMED',
      },
      include: {
        league: true,
      },
    });

    const activeLeagues = currentRegistrations.filter(
      reg => reg.league.status === 'IN_PROGRESS'
    ).length;

    // Get upcoming matches
    const upcomingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
          { player3Id: userId },
        ],
        status: 'SCHEDULED',
        scheduledTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
      take: 5,
      include: {
        player1: true,
        player2: true,
        player3: true,
        league: true,
        court: true,
      },
    });

    return NextResponse.json({
      stats: {
        totalMatches,
        wins,
        losses,
        winRate,
        totalGamesWon,
        totalGamesPlayed,
        gameWinRate,
        totalPointsScored,
        totalPointsConceded,
        avgPointsPerGame,
        pointDifferential,
        activeLeagues,
      },
      upcomingMatches,
      recentMatches: matches.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
