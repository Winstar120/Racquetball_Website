import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkMatchReminders } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { leagueId, daysAhead = 1 } = await request.json();

    // Calculate the date range for upcoming matches
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Build the query
    const whereClause: Prisma.MatchWhereInput = {
      scheduledTime: {
        gte: startDate,
        lte: endDate,
      },
      status: 'SCHEDULED',
    };

    if (leagueId) {
      whereClause.leagueId = leagueId;
    }

    // Fetch upcoming matches with player and court details
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        player1: true,
        player2: true,
        court: true,
        league: true,
      },
    });

    if (matches.length === 0) {
      return NextResponse.json({
        message: "No upcoming matches found in the specified time range",
        matchesFound: 0,
      });
    }

    // Send reminders
    const results = await sendBulkMatchReminders(matches);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} reminders successfully`,
      matchesFound: matches.length,
      remindersAttempted: results.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

// GET endpoint to preview matches that would receive notifications
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const daysAhead = parseInt(searchParams.get('daysAhead') || '1');
  const leagueId = searchParams.get('leagueId');

  try {
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);

    const whereClause: Prisma.MatchWhereInput = {
      scheduledTime: {
        gte: startDate,
        lte: endDate,
      },
      status: 'SCHEDULED',
    };

    if (leagueId) {
      whereClause.leagueId = leagueId;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            email: true,
            emailNotifications: true,
          },
        },
        player2: {
          select: {
            id: true,
            name: true,
            email: true,
            emailNotifications: true,
          },
        },
        court: true,
        league: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    return NextResponse.json({
      matches,
      count: matches.length,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview matches" },
      { status: 500 }
    );
  }
}
