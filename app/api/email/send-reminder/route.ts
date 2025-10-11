import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMatchReminder } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // Fetch match with players and court
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true,
        league: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Check if user is part of the match or an admin
    const userId = session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const isParticipant =
      match.player1Id === userId ||
      match.player2Id === userId ||
      match.player3Id === userId ||
      match.player4Id === userId;

    if (!isAdmin && !isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Send reminders to all players
    const results = [];

    if (match.player1.emailNotifications) {
      const result = await sendMatchReminder(match as any, match.player1Id);
      results.push({ player: match.player1.name, ...result });
    }

    if (match.player2.emailNotifications) {
      const result = await sendMatchReminder(match as any, match.player2Id);
      results.push({ player: match.player2.name, ...result });
    }

    if (match.player3 && match.player3.emailNotifications) {
      const result = await sendMatchReminder(match as any, match.player3Id!);
      results.push({ player: match.player3.name, ...result });
    }

    if (match.player4 && match.player4.emailNotifications) {
      const result = await sendMatchReminder(match as any, match.player4Id!);
      results.push({ player: match.player4.name, ...result });
    }

    return NextResponse.json({
      message: 'Match reminders sent',
      results
    });
  } catch (error) {
    console.error('Error sending match reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send match reminders' },
      { status: 500 }
    );
  }
}