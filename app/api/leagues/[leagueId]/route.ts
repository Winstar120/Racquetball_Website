import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        divisions: {
          orderBy: { level: "asc" },
          select: {
            id: true,
            name: true,
            level: true,
            registrations: {
              select: {
                id: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            matches: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const divisions = league.divisions.map((division) => ({
      id: division.id,
      name: division.name,
      level: division.level,
      registrations: division.registrations.length,
    }));

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        description: league.description,
        gameType: league.gameType,
        rankingMethod: league.rankingMethod,
        pointsToWin: league.pointsToWin,
        matchDuration: league.matchDuration,
        weeksForCutthroat: league.weeksForCutthroat,
        startDate: league.startDate,
        endDate: league.endDate,
        registrationOpens: league.registrationOpens,
        registrationCloses: league.registrationCloses,
        isFree: league.isFree,
        leagueFee: league.leagueFee,
        playersPerMatch: league.playersPerMatch,
        status: league.status,
        blackoutDates: league.blackoutDates ?? [],
        scheduleGenerated: league.scheduleGenerated,
        divisionSummaries: divisions,
        counts: {
          registrations: league._count.registrations,
          matches: league._count.matches,
        },
      },
    });
  } catch (error) {
    console.error("League details fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch league" },
      { status: 500 }
    );
  }
}
