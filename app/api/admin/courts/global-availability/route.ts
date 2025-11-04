import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const availability = await prisma.globalCourtAvailability.findMany({
      include: {
        court: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Fetch availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { dayOfWeek, startTime, endTime, courtId } = await request.json();

    // Validate that end time is after start time
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const availability = await prisma.globalCourtAvailability.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
        ...(courtId && { courtId })
      },
      include: {
        court: true
      }
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Create availability error:", error);
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: "This time slot already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create availability" },
      { status: 500 }
    );
  }
}
