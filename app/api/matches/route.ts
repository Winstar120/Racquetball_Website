import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'upcoming';

  try {
    const now = new Date();
    let whereClause: any = {
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
        { player3Id: session.user.id },
        { player4Id: session.user.id },
      ],
    };

    if (filter === 'upcoming') {
      whereClause.scheduledTime = { gte: now };
      whereClause.status = { in: ['SCHEDULED'] };
    } else if (filter === 'past') {
      whereClause.OR.push({ scheduledTime: { lt: now } });
      whereClause.OR.push({ status: { in: ['COMPLETED', 'CANCELLED'] } });
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
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
      orderBy: {
        scheduledTime: filter === 'past' ? 'desc' : 'asc',
      },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Match fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}