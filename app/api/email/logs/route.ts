import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function startOfWeek(date: Date) {
  const day = date.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const emailLogClient = (prisma as any).emailLog;

    const [pendingUpcomingWeek, overdue, sentThisWeek, recentLogs] = await Promise.all([
      prisma.match.count({
        where: {
          status: 'SCHEDULED',
          reminderSentAt: null,
          scheduledTime: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.match.count({
        where: {
          status: 'SCHEDULED',
          reminderSentAt: null,
          scheduledTime: {
            lt: now,
          },
        },
      }),
      emailLogClient.count({
        where: {
          type: 'MATCH_REMINDER',
          status: 'SENT',
          sentAt: {
            gte: weekStart,
          },
        },
      }),
      emailLogClient.findMany({
        orderBy: { sentAt: 'desc' },
        take: 25,
        include: {
          match: {
            select: {
              id: true,
              scheduledTime: true,
              isMakeup: true,
              league: {
                select: { name: true },
              },
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      summary: {
        pendingUpcomingWeek,
        overdue,
        sentThisWeek,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Email log fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
