import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type DisputeGame = {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  player3Score?: number | null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { matchId } = params;
    const body = (await request.json()) as { games?: DisputeGame[] };
    const games = body.games;

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: 'No disputed scores provided' },
        { status: 400 }
      );
    }

    // Get the match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        player3: true,
        games: true,
        league: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is a participant
    const isParticipant =
      match.player1Id === session.user.id ||
      match.player2Id === session.user.id ||
      match.player3Id === session.user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not a participant in this match' }, { status: 403 });
    }

    const winningScore = match.league?.pointsToWin ?? 11;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const scores = [
        game.player1Score,
        game.player2Score,
        match.player3Id ? game.player3Score : undefined,
      ].filter((score: unknown): score is number => typeof score === 'number');

      const playersAtWinningScore = scores.filter((score) => score === winningScore);
      if (playersAtWinningScore.length > 1) {
        return NextResponse.json(
          { error: `Game ${i + 1}: Only one player can have ${winningScore} points.` },
          { status: 400 }
        );
      }
    }

    // Save the disputed scores
    const disputedScores = await Promise.all(
      games.map((game) =>
        prisma.disputedScore.create({
          data: {
            matchId: matchId,
            gameNumber: game.gameNumber,
            player1Score: game.player1Score,
            player2Score: game.player2Score,
            player3Score: game.player3Score ?? null,
            reportedBy: session.user.id,
          },
        })
      )
    );

    // Update match status to disputed
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'DISPUTED',
        scoreDisputed: true,
        disputeReason: `Score disputed by ${session.user.name}`,
      },
    });

    // Get all players' emails for notification
    const players = [match.player1, match.player2];
    if (match.player3) players.push(match.player3);

    // TODO: Send email notifications to all players about the dispute
    // This would typically be done through an email service
    console.log('Score dispute notification needed for:', players.map(p => p.email));

    return NextResponse.json({
      message: 'Score dispute has been recorded',
      disputedScores,
    });
  } catch (error) {
    console.error('Error recording score dispute:', error);
    return NextResponse.json(
      { error: 'Failed to record score dispute' },
      { status: 500 }
    );
  }
}
