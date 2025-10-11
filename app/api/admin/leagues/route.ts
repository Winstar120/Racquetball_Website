import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    const { name, gameType, rankingMethod, pointsToWin, winByTwo, isFree, leagueFee, playersPerMatch, matchDuration, weeksForCutthroat, startDate, endDate, registrationOpens, registrationCloses, divisions } = data;

    const league = await prisma.league.create({
      data: {
        name,
        gameType: gameType || 'SINGLES',
        rankingMethod: rankingMethod || 'BY_WINS',
        pointsToWin: pointsToWin || 15,
        winByTwo: winByTwo !== false,
        isFree: isFree !== false,
        leagueFee: isFree === false ? (leagueFee || 0) : 0,
        playersPerMatch: playersPerMatch || 2,
        matchDuration: matchDuration || 45,
        weeksForCutthroat: weeksForCutthroat || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationOpens: new Date(registrationOpens),
        registrationCloses: new Date(registrationCloses),
        status: 'UPCOMING',
      },
    });

    if (divisions && divisions.length > 0) {
      const divisionData = divisions.map((level: string) => ({
        name: `Division ${level}`,
        level,
        leagueId: league.id,
      }));

      await prisma.division.createMany({
        data: divisionData,
      });
    }

    return NextResponse.json({ league });
  } catch (error) {
    console.error("League creation error:", error);
    return NextResponse.json(
      { error: "Failed to create league" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const leagues = await prisma.league.findMany({
      include: {
        divisions: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error("League fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leagues" },
      { status: 500 }
    );
  }
}