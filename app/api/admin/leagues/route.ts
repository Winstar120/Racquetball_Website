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
    const {
      name,
      description,
      gameType,
      rankingMethod,
      pointsToWin,
      isFree,
      leagueFee,
      playersPerMatch,
      matchDuration,
      weeksForCutthroat,
      startDate,
      endDate,
      registrationOpens,
      registrationCloses,
      divisions,
      blackoutDates
    } = data;

    const parseOptionalDate = (value: unknown, fieldName: string) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = new Date(value as string);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date provided for ${fieldName}.`);
      }
      return parsed;
    };

    const parseRequiredDate = (value: unknown, fieldName: string) => {
      const parsed = parseOptionalDate(value, fieldName);
      if (!parsed) {
        throw new Error(`${fieldName} is required.`);
      }
      return parsed;
    };

    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    try {
      parsedStartDate = parseOptionalDate(startDate, 'startDate');
      parsedEndDate = parseOptionalDate(endDate, 'endDate');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid date provided.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let parsedRegistrationOpens: Date;
    let parsedRegistrationCloses: Date;

    try {
      parsedRegistrationOpens = parseRequiredDate(registrationOpens, 'registrationOpens');
      parsedRegistrationCloses = parseRequiredDate(registrationCloses, 'registrationCloses');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid registration date provided.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const blackoutDatesArray = Array.isArray(blackoutDates)
      ? blackoutDates
      : typeof blackoutDates === "string" && blackoutDates.length > 0
      ? [blackoutDates]
      : [];
    const parsedBlackoutDates = blackoutDatesArray
      .map((date: string) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()));

    const league = await prisma.league.create({
      data: {
        name,
        description: typeof description === 'string' && description.trim().length > 0 ? description.trim() : null,
        gameType: gameType || 'SINGLES',
        rankingMethod: rankingMethod || 'BY_WINS',
        pointsToWin: pointsToWin || 15,
        isFree: isFree !== false,
        leagueFee: isFree === false ? (leagueFee || 0) : 0,
        playersPerMatch: playersPerMatch || 2,
        matchDuration: matchDuration || 45,
        weeksForCutthroat: weeksForCutthroat || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        registrationOpens: parsedRegistrationOpens,
        registrationCloses: parsedRegistrationCloses,
        blackoutDates: parsedBlackoutDates,
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
