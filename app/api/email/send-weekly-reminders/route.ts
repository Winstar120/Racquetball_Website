import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMatchReminder, EmailSendResult } from '@/lib/email';
import type { MatchWithPlayers } from '@/lib/email';

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date) {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday
  const mondayOffset = (day + 6) % 7; // Monday -> 0
  const monday = new Date(date);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const cronAuthorized = Boolean(
      cronSecret && authHeader === `Bearer ${cronSecret}`
    );

    if (!cronAuthorized) {
      const session = await getServerSession(authOptions);

      if (!session || !session.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { error: 'SMTP not configured. Aborting weekly reminders.' },
        { status: 503 }
      );
    }

    const now = new Date();
    const windowStart = startOfWeek(startOfDay(now));
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 7);

    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED',
        reminderSentAt: null,
        scheduledTime: {
          gte: windowStart,
          lt: windowEnd,
        },
      },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true,
        league: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    if (matches.length === 0) {
      return NextResponse.json({
        message: 'No matches found requiring reminders for the upcoming week.',
        matchesProcessed: 0,
        remindersSent: 0,
        emailsSent: 0,
      });
    }

    const matchResults: Array<{
      matchId: string;
      reminderSentAt: Date | null;
      emailsAttempted: number;
      emailsSent: number;
      errors: Array<{ player: string; error: unknown }>;
    }> = [];

    let totalEmailsSent = 0;
    let matchesNotified = 0;

    for (const match of matches) {
      const matchWithPlayers = match as MatchWithPlayers;
      const perMatchResults: Array<{ player: string } & EmailSendResult> = [];

      const candidates: Array<{ id: string; name: string; emailNotifications?: boolean }> = [
        { id: match.player1Id, name: match.player1.name, emailNotifications: match.player1.emailNotifications },
        { id: match.player2Id, name: match.player2.name, emailNotifications: match.player2.emailNotifications },
      ];

      if (match.player3 && match.player3Id) {
        candidates.push({
          id: match.player3Id,
          name: match.player3.name,
          emailNotifications: match.player3.emailNotifications,
        });
      }

      if (match.player4 && match.player4Id) {
        candidates.push({
          id: match.player4Id,
          name: match.player4.name,
          emailNotifications: match.player4.emailNotifications,
        });
      }

      for (const candidate of candidates) {
        if (!candidate.emailNotifications) continue;

        const result = await sendMatchReminder(matchWithPlayers, candidate.id);
        perMatchResults.push({ player: candidate.name, ...result });
      }

      const successfulEmails = perMatchResults.filter(
        (result) => result.success && !result.skipped
      );

      const errors = perMatchResults
        .filter((result) => result.error)
        .map(({ player, error }) => ({ player, error }));

      let reminderSentAt: Date | null = null;

      if (successfulEmails.length > 0) {
        const updated = await prisma.match.update({
          where: { id: match.id },
          data: { reminderSentAt: new Date() },
          select: { reminderSentAt: true },
        });
        reminderSentAt = updated.reminderSentAt;
        matchesNotified += 1;
        totalEmailsSent += successfulEmails.length;
      }

      matchResults.push({
        matchId: match.id,
        reminderSentAt,
        emailsAttempted: perMatchResults.length,
        emailsSent: successfulEmails.length,
        errors,
      });
    }

    return NextResponse.json({
      message: 'Weekly reminders processed',
      matchesProcessed: matches.length,
      matchesNotified,
      emailsSent: totalEmailsSent,
      details: matchResults,
    });
  } catch (error) {
    console.error('Weekly reminder send error:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly reminders' },
      { status: 500 }
    );
  }
}
