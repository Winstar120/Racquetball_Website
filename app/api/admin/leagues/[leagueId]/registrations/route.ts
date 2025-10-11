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
    const registrations = await prisma.leagueRegistration.findMany({
      where: { leagueId: leagueId },
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
        division: true,
      },
      orderBy: [
        { division: { level: 'asc' } },
        { registrationDate: 'desc' },
      ],
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Registrations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}