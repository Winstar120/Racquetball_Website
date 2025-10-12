import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { games } = await request.json();

    // Fetch the match to verify user is a player
    const match = await prisma.match.findUnique({
      where: { id: params.matchId },
      include: {
        games: true,
        league: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this match
    const userIsPlayer =
      match.player1Id === session.user.id ||
      match.player2Id === session.user.id ||
      match.player3Id === session.user.id ||
      match.player4Id === session.user.id;

    if (!userIsPlayer) {
      return NextResponse.json(
        { error: "You are not authorized to report scores for this match" },
        { status: 403 }
      );
    }

    // Check if scores have already been reported
    if (match.games.length > 0 && match.scoreReportedBy !== session.user.id) {
      // Different user reported, need confirmation
      return NextResponse.json(
        { error: "Scores have already been reported by another player. Please confirm the scores instead." },
        { status: 400 }
      );
    }

    const winningScore = match.league.pointsToWin ?? 11;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const scores = [
        game.player1Score,
        game.player2Score,
        match.player3Id ? game.player3Score : undefined,
      ].filter((score) => typeof score === 'number');

      const playersAtWinningScore = scores.filter((score) => score === winningScore);

      if (playersAtWinningScore.length > 1) {
        return NextResponse.json(
          { error: `Game ${i + 1}: Only one player can have ${winningScore} points.` },
          { status: 400 }
        );
      }
    }

    // Delete existing games if updating
    if (match.games.length > 0) {
      await prisma.game.deleteMany({
        where: { matchId: params.matchId },
      });
    }

    // Create new game records
    const gameData = games.map((game: any, index: number) => ({
      matchId: params.matchId,
      gameNumber: index + 1,
      player1Score: game.player1Score,
      player2Score: game.player2Score,
      player3Score: game.player3Score || null,
      winnerId: determineGameWinner(game, match),
    }));

    await prisma.game.createMany({
      data: gameData,
    });

    // Determine overall match winner (player who won most games)
    const matchWinnerId = determineMatchWinner(gameData);

    // Update match with score information
    const updateData: any = {
      scoreReportedBy: session.user.id,
      scoreReportedAt: new Date(),
      status: 'IN_PROGRESS',
      winnerId: matchWinnerId,
    };

    // Auto-confirm if the reporter is player1
    if (match.player1Id === session.user.id) {
      updateData.player1Confirmed = true;
    } else if (match.player2Id === session.user.id) {
      updateData.player2Confirmed = true;
    }

    await prisma.match.update({
      where: { id: params.matchId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Score submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit scores" },
      { status: 500 }
    );
  }
}

function determineGameWinner(game: any, match: any): string | null {
  const { player1Score, player2Score, player3Score } = game;
  const { pointsToWin, winByTwo } = match.league;

  if (match.league.gameType === 'CUTTHROAT') {
    // In cut-throat, highest score wins
    const scores = [
      { id: match.player1Id, score: player1Score },
      { id: match.player2Id, score: player2Score },
      match.player3Id ? { id: match.player3Id, score: player3Score ?? 0 } : null,
    ].filter((s): s is { id: string; score: number } => !!s);

    const maxScore = Math.max(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === maxScore);

    if (winners.length === 1) {
      return winners[0].id;
    }

    return null;
  }

  // Singles or Doubles - highest score wins
  if (winByTwo) {
    const scoreDiff = Math.abs(player1Score - player2Score);
    if (scoreDiff >= 2) {
      if (player1Score >= pointsToWin && player1Score > player2Score) {
        return match.player1Id;
      }
      if (player2Score >= pointsToWin && player2Score > player1Score) {
        return match.player2Id;
      }
    }
  } else {
    if (player1Score >= pointsToWin) return match.player1Id;
    if (player2Score >= pointsToWin) return match.player2Id;
  }

  return null;
}

function determineMatchWinner(games: any[]): string | null {
  const winCounts: Record<string, number> = {};

  games.forEach(game => {
    if (game.winnerId) {
      winCounts[game.winnerId] = (winCounts[game.winnerId] || 0) + 1;
    }
  });

  const winners = Object.entries(winCounts);
  if (winners.length === 0) return null;

  winners.sort((a, b) => b[1] - a[1]);
  return winners[0][0];
}
