import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        league: true,
        player1: {
          select: { id: true, name: true, email: true, phone: true },
        },
        player2: {
          select: { id: true, name: true, email: true, phone: true },
        },
        player3: {
          select: { id: true, name: true, email: true, phone: true },
        },
        player4: {
          select: { id: true, name: true, email: true, phone: true },
        },
        court: true,
        games: {
          orderBy: { gameNumber: 'asc' },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this match
    const userIsPlayer =
      match.player1Id === session.user.id ||
      match.player2Id === session.user.id ||
      match.player3Id === session.user.id ||
      match.player4Id === session.user.id;

    if (!userIsPlayer && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to view this match" },
        { status: 403 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Match fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
