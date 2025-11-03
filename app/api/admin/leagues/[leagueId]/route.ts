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
      startDate,
      endDate,
      registrationOpens,
      registrationCloses,
      isFree,
      leagueFee,
      description,
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

    const updateData: Record<string, any> = {};

    if (typeof name === 'string') updateData.name = name.trim();
    if (typeof rankingMethod === 'string') updateData.rankingMethod = rankingMethod;
    if (typeof gameType === 'string') updateData.gameType = gameType;
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

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: updateData,
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
