import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // First update league statuses based on current date
    const now = new Date();
    const leaguesToUpdate = await prisma.league.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      }
    });

    for (const league of leaguesToUpdate) {
      let newStatus = league.status;
      const regOpens = new Date(league.registrationOpens);
      const regCloses = new Date(league.registrationCloses);
      const startDate = league.startDate ? new Date(league.startDate) : null;
      const endDate = league.endDate ? new Date(league.endDate) : null;

      if (now < regOpens) {
        newStatus = 'UPCOMING';
      } else if (now >= regOpens && now <= regCloses) {
        newStatus = 'REGISTRATION_OPEN';
      } else if (now > regCloses && (!startDate || now < startDate)) {
        newStatus = 'REGISTRATION_CLOSED';
      } else if (startDate && endDate && now >= startDate && now <= endDate) {
        newStatus = 'IN_PROGRESS';
      } else if (endDate && now > endDate) {
        newStatus = 'COMPLETED';
      }

      if (newStatus !== league.status) {
        await prisma.league.update({
          where: { id: league.id },
          data: { status: newStatus }
        });
      }
    }

    // Now fetch leagues with updated statuses
    const leagues = await prisma.league.findMany({
      include: {
        divisions: true,
        _count: {
          select: {
            registrations: true,
          },
        },
        registrations: {
          where: {
            userId: session.user.id
          },
          include: {
            division: true
          }
        }
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    const leaguesWithUserRegistration = leagues.map(league => {
      const userRegistration = league.registrations[0];
      return {
        ...league,
        userRegistration: userRegistration ? {
          status: userRegistration.status,
          division: userRegistration.division
        } : undefined,
        registrations: undefined
      };
    });

    return NextResponse.json({ leagues: leaguesWithUserRegistration });
  } catch (error) {
    console.error("League fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leagues" },
      { status: 500 }
    );
  }
}
