import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};

    if (leagueId && leagueId !== 'all') {
      where.leagueId = leagueId;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { player1: { name: { contains: search, mode: 'insensitive' } } },
        { player2: { name: { contains: search, mode: 'insensitive' } } },
        {
          AND: [
            { player3Id: { not: null } },
            { player3: { name: { contains: search, mode: 'insensitive' } } }
          ]
        },
        {
          AND: [
            { player4Id: { not: null } },
            { player4: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ];
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        league: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true,
        games: {
          orderBy: { gameNumber: 'asc' }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    // Get all leagues for filter dropdown
    const leagues = await prisma.league.findMany({
      select: {
        id: true,
        name: true,
        gameType: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({ matches, leagues });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leagueId, player1Id, player2Id, player3Id, player4Id, courtId, scheduledTime, weekNumber } = body;

    // Validate required fields
    if (!leagueId || !player1Id || !player2Id || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get league to check game type
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Validate players based on game type
    if (league.gameType === 'CUTTHROAT' && !player3Id) {
      return NextResponse.json({ error: 'Cut-throat requires 3 players' }, { status: 400 });
    }

    if (league.gameType === 'DOUBLES' && (!player3Id || !player4Id)) {
      return NextResponse.json({ error: 'Doubles requires 4 players' }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        leagueId,
        player1Id,
        player2Id,
        player3Id: player3Id || null,
        player4Id: player4Id || null,
        courtId: courtId || null,
        scheduledTime: new Date(scheduledTime),
        weekNumber: weekNumber || 1,
        status: 'SCHEDULED'
      },
      include: {
        league: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true
      }
    });

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, updates } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: updates,
      include: {
        league: true,
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true
      }
    });

    return NextResponse.json({ match });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    // Delete related games first
    await prisma.game.deleteMany({
      where: { matchId }
    });

    // Then delete the match
    await prisma.match.delete({
      where: { id: matchId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}