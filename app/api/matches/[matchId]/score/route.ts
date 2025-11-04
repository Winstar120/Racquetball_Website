import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubmittedGame = {
  player1Score: number;
  player2Score: number;
  player3Score?: number | null;
};

type PersistedGame = SubmittedGame & {
  matchId: string;
  gameNumber: number;
  winnerId: string | null;
};

type MatchWithLeague = Prisma.MatchGetPayload<{
  include: {
    games: true;
    league: true;
  };
}>;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as { games?: SubmittedGame[] };
    const games = body.games;

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: "No game scores provided" },
        { status: 400 }
      );
    }

    // Fetch the match to verify user is a player
    const match = await prisma.match.findUnique({
      where: { id: matchId },
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

    const resolvedMatch = match as MatchWithLeague;

    // Check if user is part of this match
    const userIsPlayer =
      resolvedMatch.player1Id === session.user.id ||
      resolvedMatch.player2Id === session.user.id ||
      resolvedMatch.player3Id === session.user.id ||
      resolvedMatch.player4Id === session.user.id;

    if (!userIsPlayer) {
      return NextResponse.json(
        { error: "You are not authorized to report scores for this match" },
        { status: 403 }
      );
    }

    // Check if scores have already been reported
    if (resolvedMatch.games.length > 0 && resolvedMatch.scoreReportedBy !== session.user.id) {
      // Different user reported, need confirmation
      return NextResponse.json(
        { error: "Scores have already been reported by another player. Please confirm the scores instead." },
        { status: 400 }
      );
    }

    const winningScore = resolvedMatch.league.pointsToWin ?? 11;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const scores = [
        game.player1Score,
        game.player2Score,
        resolvedMatch.player3Id ? game.player3Score : undefined,
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
        where: { matchId },
      });
    }

    // Create new game records
    const gameData: PersistedGame[] = games.map((game, index) => ({
      matchId,
      gameNumber: index + 1,
      player1Score: game.player1Score,
      player2Score: game.player2Score,
      player3Score: game.player3Score ?? null,
      winnerId: determineGameWinner(game, resolvedMatch),
    }));

    await prisma.game.createMany({
      data: gameData,
    });

    // Determine overall match winner (player who won most games)
    const matchWinnerId = determineMatchWinner(gameData);

    // Update match with score information
    const updateData: Prisma.MatchUpdateInput = {
      scoreReportedBy: session.user.id,
      scoreReportedAt: new Date(),
      status: 'IN_PROGRESS',
      winnerId: matchWinnerId,
    };

    // Auto-confirm if the reporter is player1
    if (resolvedMatch.player1Id === session.user.id) {
      updateData.player1Confirmed = true;
    } else if (resolvedMatch.player2Id === session.user.id) {
      updateData.player2Confirmed = true;
    }

    await prisma.match.update({
      where: { id: matchId },
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

function determineGameWinner(game: SubmittedGame, match: MatchWithLeague): string | null {
  const { player1Score, player2Score, player3Score } = game;
  const { pointsToWin } = match.league;

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
  if (player1Score >= pointsToWin && player1Score > player2Score) {
    return match.player1Id;
  }
  if (player2Score >= pointsToWin && player2Score > player1Score) {
    return match.player2Id;
  }

  return null;
}

function determineMatchWinner(games: PersistedGame[]): string | null {
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
