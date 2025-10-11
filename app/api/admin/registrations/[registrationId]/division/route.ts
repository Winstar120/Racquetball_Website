import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const { registrationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { divisionId } = await request.json();

    const registration = await prisma.leagueRegistration.update({
      where: { id: registrationId },
      data: {
        divisionId: divisionId || null
      },
      include: {
        division: true,
        user: true,
      }
    });

    // Update user's skill level based on division
    if (divisionId && registration.division) {
      await prisma.user.update({
        where: { id: registration.userId },
        data: { skillLevel: registration.division.level }
      });
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error("Division update error:", error);
    return NextResponse.json(
      { error: "Failed to update division" },
      { status: 500 }
    );
  }
}