import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { registrationId } = await params;

    // Check if registration exists
    const registration = await prisma.leagueRegistration.findUnique({
      where: { id: registrationId },
      include: {
        user: true,
        league: true,
      }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if there are any matches associated with this player in this league
    const hasMatches = await prisma.match.findFirst({
      where: {
        leagueId: registration.leagueId,
        OR: [
          { player1Id: registration.userId },
          { player2Id: registration.userId },
          { player3Id: registration.userId },
          { player4Id: registration.userId }
        ]
      }
    });

    if (hasMatches) {
      // If player has matches, we should handle them appropriately
      // For now, we'll prevent deletion if they have matches
      return NextResponse.json(
        {
          error: 'Cannot remove member with scheduled or completed matches. Please reassign or delete their matches first.'
        },
        { status: 400 }
      );
    }

    // Delete the registration
    await prisma.leagueRegistration.delete({
      where: { id: registrationId }
    });

    return NextResponse.json({
      message: `Successfully removed ${registration.user.name} from ${registration.league.name}`,
      success: true
    });

  } catch (error) {
    console.error('Error removing league member:', error);
    return NextResponse.json(
      { error: 'Failed to remove league member' },
      { status: 500 }
    );
  }
}