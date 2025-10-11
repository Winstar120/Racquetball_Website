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
    const courts = await prisma.court.findMany({
      include: {
        availability: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ courts });
  } catch (error) {
    console.error("Court fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courts" },
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
    const { name, location } = await request.json();

    const court = await prisma.court.create({
      data: {
        name,
        location: location || null,
        isActive: true
      }
    });

    return NextResponse.json({ court });
  } catch (error) {
    console.error("Court creation error:", error);
    return NextResponse.json(
      { error: "Failed to create court" },
      { status: 500 }
    );
  }
}