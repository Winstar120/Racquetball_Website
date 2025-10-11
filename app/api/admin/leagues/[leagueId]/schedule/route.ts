import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLeagueSchedule } from "@/lib/scheduling";

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
    // Check if schedule already exists
    const existingMatches = await prisma.match.findMany({
      where: { leagueId },
      include: {
        player1: true,
        player2: true,
        player3: true,
        player4: true,
        court: true
      },
      orderBy: [
        { weekNumber: 'asc' },
        { scheduledTime: 'asc' }
      ]
    });

    if (existingMatches.length > 0) {
      return NextResponse.json({
        matches: existingMatches,
        isGenerated: true,
        totalWeeks: Math.max(...existingMatches.map(m => m.weekNumber || 0)),
        totalMatches: existingMatches.length,
        makeupMatches: existingMatches.filter(m => m.isMakeup).length
      });
    }

    // Generate preview without saving
    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const preview = await generateLeagueSchedule(leagueId, league.matchDuration);

    // Fetch player data for the preview
    const playerIds = new Set<string>();
    [...preview.scheduledMatches, ...preview.makeupMatches].forEach(match => {
      playerIds.add(match.player1Id);
      playerIds.add(match.player2Id);
      if (match.player3Id) playerIds.add(match.player3Id);
      if (match.player4Id) playerIds.add(match.player4Id);
    });

    const players = await prisma.user.findMany({
      where: { id: { in: Array.from(playerIds) } },
      select: { id: true, name: true, email: true }
    });

    const playerMap = new Map(players.map(p => [p.id, p]));

    // Add player data to matches
    const enrichedScheduledMatches = preview.scheduledMatches.map(match => ({
      ...match,
      player1: playerMap.get(match.player1Id),
      player2: playerMap.get(match.player2Id),
      player3: match.player3Id ? playerMap.get(match.player3Id) : undefined,
      player4: match.player4Id ? playerMap.get(match.player4Id) : undefined,
    }));

    const enrichedMakeupMatches = preview.makeupMatches.map(match => ({
      ...match,
      player1: playerMap.get(match.player1Id),
      player2: playerMap.get(match.player2Id),
      player3: match.player3Id ? playerMap.get(match.player3Id) : undefined,
      player4: match.player4Id ? playerMap.get(match.player4Id) : undefined,
    }));

    return NextResponse.json({
      preview: {
        ...preview,
        scheduledMatches: enrichedScheduledMatches,
        makeupMatches: enrichedMakeupMatches
      },
      isGenerated: false
    });
  } catch (error) {
    console.error("Schedule generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    // Check if schedule already exists
    const existingMatches = await prisma.match.count({
      where: { leagueId }
    });

    if (existingMatches > 0) {
      return NextResponse.json(
        { error: "Schedule already generated for this league" },
        { status: 400 }
      );
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    // Generate schedule
    const { scheduledMatches, makeupMatches } = await generateLeagueSchedule(leagueId, league.matchDuration);

    // Ensure we have courts in the database
    let court1 = await prisma.court.findFirst({ where: { number: 1 } });
    if (!court1) {
      court1 = await prisma.court.create({
        data: {
          name: "Court 1",
          number: 1,
          isActive: true
        }
      });
    }

    let court2 = await prisma.court.findFirst({ where: { number: 2 } });
    if (!court2) {
      court2 = await prisma.court.create({
        data: {
          name: "Court 2",
          number: 2,
          isActive: true
        }
      });
    }

    // Save scheduled matches
    const matchData = scheduledMatches.map(match => ({
      leagueId,
      divisionId: match.divisionId,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player3Id: match.player3Id,
      player4Id: match.player4Id,
      courtId: match.courtNumber === 1 ? court1.id : court2.id,
      courtNumber: match.courtNumber,
      scheduledTime: match.scheduledTime,
      weekNumber: match.weekNumber,
      isMakeup: false,
      status: 'SCHEDULED' as const
    }));

    // Save makeup matches
    const makeupData = makeupMatches.map(match => ({
      leagueId,
      divisionId: match.divisionId,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player3Id: match.player3Id,
      player4Id: match.player4Id,
      courtId: null,
      courtNumber: null,
      scheduledTime: match.scheduledTime,
      weekNumber: match.weekNumber,
      isMakeup: true,
      status: 'SCHEDULED' as const
    }));

    const allMatches = await prisma.match.createMany({
      data: [...matchData, ...makeupData]
    });

    // Mark league as scheduled
    await prisma.league.update({
      where: { id: leagueId },
      data: { scheduleGenerated: true }
    });

    return NextResponse.json({
      success: true,
      totalMatches: scheduledMatches.length,
      makeupMatches: makeupMatches.length,
      message: `Created ${scheduledMatches.length} scheduled matches and ${makeupMatches.length} makeup matches`
    });
  } catch (error) {
    console.error("Schedule creation error:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

// Delete all matches for a league (reset schedule)
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
    await prisma.match.deleteMany({
      where: { leagueId }
    });

    await prisma.league.update({
      where: { id: leagueId },
      data: { scheduleGenerated: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Schedule deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}