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
      select: {
        id: true,
        name: true,
        isFree: true,
        gameType: true,
        divisions: {
          orderBy: { level: 'asc' },
          select: {
            id: true,
            name: true,
            level: true,
          }
        }
      }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const registrations = await prisma.leagueRegistration.findMany({
      where: { leagueId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            level: true,
          }
        },
      },
      orderBy: [
        { division: { level: 'asc' } },
        { registrationDate: 'desc' },
      ],
    });

    return NextResponse.json({ league, registrations });
  } catch (error) {
    console.error("Registrations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
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
    const body = await request.json();
    const { userId, divisionId } = body ?? {};

    if (!userId || !divisionId) {
      return NextResponse.json(
        { error: "User and division are required" },
        { status: 400 }
      );
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        isFree: true,
        divisions: {
          select: { id: true }
        }
      }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const division = league.divisions.find(d => d.id === divisionId);
    if (!division) {
      return NextResponse.json(
        { error: "Division does not belong to this league" },
        { status: 400 }
      );
    }

    const alreadyRegistered = await prisma.leagueRegistration.findUnique({
      where: {
        userId_leagueId: {
          userId,
          leagueId,
        }
      }
    });

    if (alreadyRegistered) {
      return NextResponse.json(
        { error: "User is already registered for this league" },
        { status: 400 }
      );
    }

    const newRegistration = await prisma.leagueRegistration.create({
      data: {
        userId,
        leagueId,
        divisionId,
        status: 'CONFIRMED',
        paymentStatus: league.isFree ? 'PAID' : 'UNPAID',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skillLevel: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
            level: true,
          }
        },
      }
    });

    return NextResponse.json({ registration: newRegistration });
  } catch (error) {
    console.error("Registration creation error:", error);
    return NextResponse.json(
      { error: "Failed to add registration" },
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
    const url = new URL(request.url);
    const registrationId = url.searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID required" },
        { status: 400 }
      );
    }

    const registration = await prisma.leagueRegistration.findUnique({
      where: { id: registrationId },
      include: {
        user: {
          select: { id: true, name: true }
        },
        league: {
          select: { id: true, name: true }
        }
      }
    });

    if (!registration || registration.league.id !== leagueId) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const hasMatches = await prisma.match.findFirst({
      where: {
        leagueId,
        OR: [
          { player1Id: registration.userId },
          { player2Id: registration.userId },
          { player3Id: registration.userId },
          { player4Id: registration.userId },
        ],
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
        },
      },
    });

    if (hasMatches) {
      return NextResponse.json(
        { error: "Cannot remove player with scheduled or completed matches. Adjust matches first." },
        { status: 400 }
      );
    }

    await prisma.leagueRegistration.delete({
      where: { id: registrationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration deletion error:", error);
    return NextResponse.json(
      { error: "Failed to remove registration" },
      { status: 500 }
    );
  }
}
