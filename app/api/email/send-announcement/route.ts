import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendLeagueAnnouncement } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can send announcements
    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leagueId, subject, message } = await request.json();

    if (!leagueId || !subject || !message) {
      return NextResponse.json(
        { error: 'League ID, subject, and message are required' },
        { status: 400 }
      );
    }

    // Fetch league details
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
          include: { user: true }
        }
      }
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get all registered users
    const recipients = league.registrations.map(reg => reg.user);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No registered users to send announcement to' },
        { status: 400 }
      );
    }

    // Send announcement to all registered users
    const results = await sendLeagueAnnouncement(
      recipients,
      league,
      subject,
      message
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: 'Announcement sent',
      successful,
      failed,
      total: recipients.length,
      results
    });
  } catch (error) {
    console.error('Error sending league announcement:', error);
    return NextResponse.json(
      { error: 'Failed to send league announcement' },
      { status: 500 }
    );
  }
}
