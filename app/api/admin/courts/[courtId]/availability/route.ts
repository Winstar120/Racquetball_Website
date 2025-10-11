import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courtId: string }> }
) {
  const { courtId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { dayOfWeek, startTime, endTime } = await request.json();

    const availability = await prisma.courtAvailability.create({
      data: {
        courtId: courtId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime
      }
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Availability creation error:", error);
    return NextResponse.json(
      { error: "Failed to add availability" },
      { status: 500 }
    );
  }
}