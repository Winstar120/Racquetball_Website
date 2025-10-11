import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courtId: string; availabilityId: string }> }
) {
  const { courtId, availabilityId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await prisma.courtAvailability.delete({
      where: {
        id: availabilityId,
        courtId: courtId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}