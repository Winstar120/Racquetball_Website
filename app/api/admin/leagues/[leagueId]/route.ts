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

  if (!session || !session.user.isAdmin) {
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
          orderBy: { level: 'asc' }
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

    return NextResponse.json({ league });
  } catch (error) {
    console.error("League fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch league" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const existingLeague = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        gameType: true,
        scheduleGenerated: true,
      }
    });

    if (!existingLeague) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      gameType,
      rankingMethod,
      pointsToWin,
      matchDuration,
      numberOfGames,
      startDate,
      endDate,
      registrationOpens,
      registrationCloses,
      isFree,
      leagueFee,
      description,
      blackoutDates,
      weeksForCutthroat,
      divisions,
    } = body ?? {};

    if (
      existingLeague.scheduleGenerated &&
      gameType &&
      gameType !== existingLeague.gameType
    ) {
      return NextResponse.json(
        { error: "Cannot change game type after schedule has been generated." },
        { status: 400 }
      );
    }

    const derivePlayersPerMatch = (value: string) => {
      switch (value) {
        case 'SINGLES':
          return 2;
        case 'CUTTHROAT':
          return 3;
        default:
          return 4;
      }
    };

    const updateData: Record<string, any> = {};

    if (typeof name === 'string') updateData.name = name.trim();
    if (typeof rankingMethod === 'string') updateData.rankingMethod = rankingMethod;
    if (typeof gameType === 'string') {
      updateData.gameType = gameType;
      updateData.playersPerMatch = derivePlayersPerMatch(gameType);
      if (gameType !== 'CUTTHROAT') {
        updateData.weeksForCutthroat = null;
      }
    }
    if (typeof description === 'string') updateData.description = description.trim();

    if (pointsToWin !== undefined) {
      const parsed = Number(pointsToWin);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "Points to win must be a positive number." },
          { status: 400 }
        );
      }
      updateData.pointsToWin = parsed;
    }

    if (numberOfGames !== undefined) {
      const parsedGames = Number(numberOfGames);
      if (!Number.isFinite(parsedGames) || parsedGames <= 0) {
        return NextResponse.json(
          { error: "Number of games must be a positive number." },
          { status: 400 }
        );
      }
      updateData.numberOfGames = Math.round(parsedGames);
    }

    if (matchDuration !== undefined) {
      const parsed = Number(matchDuration);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "Match duration must be a positive number." },
          { status: 400 }
        );
      }
      updateData.matchDuration = parsed;
    }

    if (weeksForCutthroat !== undefined) {
      const rawWeeks = String(weeksForCutthroat).trim();
      if (rawWeeks === '') {
        updateData.weeksForCutthroat = null;
      } else {
        const parsedWeeks = Number(rawWeeks);
        if (!Number.isFinite(parsedWeeks) || parsedWeeks <= 0) {
          return NextResponse.json(
            { error: "Weeks for cut-throat must be a positive number." },
            { status: 400 }
          );
        }
        updateData.weeksForCutthroat = Math.round(parsedWeeks);
      }
    }

    if (isFree !== undefined) {
      updateData.isFree = Boolean(isFree);
      if (updateData.isFree) {
        updateData.leagueFee = 0;
      } else if (leagueFee !== undefined) {
        const parsedFee = Number(leagueFee);
        if (!Number.isFinite(parsedFee) || parsedFee < 0) {
          return NextResponse.json(
            { error: "League fee must be a non-negative number." },
            { status: 400 }
          );
        }
        updateData.leagueFee = parsedFee;
      }
    } else if (leagueFee !== undefined) {
      const parsedFee = Number(leagueFee);
      if (!Number.isFinite(parsedFee) || parsedFee < 0) {
        return NextResponse.json(
          { error: "League fee must be a non-negative number." },
          { status: 400 }
        );
      }
      updateData.leagueFee = parsedFee;
    }

    const dateFields: Array<{ key: keyof typeof updateData; value: any; nullable: boolean }> = [
      { key: 'startDate', value: startDate, nullable: true },
      { key: 'endDate', value: endDate, nullable: true },
      { key: 'registrationOpens', value: registrationOpens, nullable: false },
      { key: 'registrationCloses', value: registrationCloses, nullable: false },
    ];

    for (const { key, value, nullable } of dateFields) {
      if (value === undefined) continue;

      if ((value === null || value === '') && nullable) {
        updateData[key] = null;
        continue;
      }

      if (value === null || value === '') {
        continue;
      }

      const parsedDate = new Date(value);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: `Invalid date provided for ${key}.` },
          { status: 400 }
        );
      }
      updateData[key] = parsedDate;
    }

    if (blackoutDates !== undefined) {
      const values = Array.isArray(blackoutDates)
        ? blackoutDates
        : typeof blackoutDates === 'string'
        ? blackoutDates.split(/[\n,]+/)
        : [];

      const parsedDates = values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()));

      updateData.blackoutDates = parsedDates;
    }

    let divisionsUpdated = false;
    if (divisions !== undefined) {
      divisionsUpdated = true;
      const rawLevels = Array.isArray(divisions)
        ? divisions
        : typeof divisions === 'string'
        ? divisions.split(',')
        : [];

      const normalizedLevels = Array.from(
        new Set(
          [...rawLevels.map((level: any) => String(level).trim()).filter(Boolean), 'N/A']
        )
      );

      const existingDivisions = await prisma.division.findMany({
        where: { leagueId },
        select: { id: true, level: true },
      });

      const existingLevels = new Set(existingDivisions.map((division) => division.level));
      const toDeleteIds = existingDivisions
        .filter((division) => !normalizedLevels.includes(division.level))
        .map((division) => division.id);
      const toAddLevels = normalizedLevels.filter((level) => !existingLevels.has(level));

      const divisionTransactions: any[] = [];

      if (toDeleteIds.length > 0) {
        divisionTransactions.push(
          prisma.division.deleteMany({
            where: {
              id: {
                in: toDeleteIds,
              },
            },
          })
        );
      }

      if (toAddLevels.length > 0) {
        divisionTransactions.push(
          prisma.division.createMany({
            data: toAddLevels.map((level) => ({
              leagueId,
              level,
              name: `Division ${level}`,
            })),
          })
        );
      }

      const divisionsToUpdate = existingDivisions.filter((division) =>
        normalizedLevels.includes(division.level)
      );

      divisionsToUpdate.forEach((division) => {
        divisionTransactions.push(
          prisma.division.update({
            where: { id: division.id },
            data: { name: `Division ${division.level}` },
          })
        );
      });

      if (divisionTransactions.length > 0) {
        await prisma.$transaction(divisionTransactions);
      }
    }

    if (Object.keys(updateData).length === 0 && !divisionsUpdated) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const includeConfig = {
      divisions: {
        orderBy: { level: 'asc' as const },
      },
      _count: {
        select: {
          registrations: true,
          matches: true,
        },
      },
    };

    const updatedLeague = Object.keys(updateData).length > 0
      ? await prisma.league.update({
          where: { id: leagueId },
          data: updateData,
          include: includeConfig,
        })
      : await prisma.league.findUnique({
          where: { id: leagueId },
          include: includeConfig,
        });

    return NextResponse.json({ league: updatedLeague });
  } catch (error) {
    console.error("League update error:", error);
    return NextResponse.json(
      { error: "Failed to update league" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Remove related data first to satisfy foreign key constraints
    await prisma.match.deleteMany({
      where: { leagueId },
    });

    await prisma.leagueRegistration.deleteMany({
      where: { leagueId },
    });

    await prisma.division.deleteMany({
      where: { leagueId },
    });

    await prisma.league.delete({
      where: { id: leagueId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("League deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete league" },
      { status: 500 }
    );
  }
}
