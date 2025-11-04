import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get the match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        player3: true,
        games: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Verify the user is a participant
    const userId = session.user.id;
    const isPlayer1 = match.player1Id === userId;
    const isPlayer2 = match.player2Id === userId;
    const isPlayer3 = match.player3Id === userId;

    if (!isPlayer1 && !isPlayer2 && !isPlayer3) {
      return NextResponse.json({ error: 'You are not a participant in this match' }, { status: 403 });
    }

    // Check if this player has already confirmed
    if ((isPlayer1 && match.player1Confirmed) ||
        (isPlayer2 && match.player2Confirmed)) {
      return NextResponse.json({ error: 'You have already confirmed this score' }, { status: 400 });
    }

    // Update the confirmation status
    const updateData: Prisma.MatchUpdateInput = {};
    if (isPlayer1) {
      updateData.player1Confirmed = true;
    } else if (isPlayer2) {
      updateData.player2Confirmed = true;
    }

    // If all players have confirmed, mark the match as completed
    const willBeFullyConfirmed =
      (isPlayer1 ? true : match.player1Confirmed) &&
      (isPlayer2 ? true : match.player2Confirmed);

    if (willBeFullyConfirmed) {
      updateData.status = 'COMPLETED';
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Score confirmed successfully',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Error confirming score:', error);
    return NextResponse.json(
      { error: 'Failed to confirm score' },
      { status: 500 }
    );
  }
}
