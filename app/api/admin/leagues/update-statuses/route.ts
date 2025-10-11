import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const now = new Date();

    // Get all leagues
    const leagues = await prisma.league.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      }
    });

    const updates = [];

    for (const league of leagues) {
      let newStatus = league.status;
      const regOpens = new Date(league.registrationOpens);
      const regCloses = new Date(league.registrationCloses);
      const startDate = new Date(league.startDate);
      const endDate = new Date(league.endDate);

      if (now < regOpens) {
        newStatus = 'UPCOMING';
      } else if (now >= regOpens && now <= regCloses) {
        newStatus = 'REGISTRATION_OPEN';
      } else if (now > regCloses && now < startDate) {
        newStatus = 'REGISTRATION_CLOSED';
      } else if (now >= startDate && now <= endDate) {
        newStatus = 'IN_PROGRESS';
      } else if (now > endDate) {
        newStatus = 'COMPLETED';
      }

      if (newStatus !== league.status) {
        updates.push(
          prisma.league.update({
            where: { id: league.id },
            data: { status: newStatus }
          })
        );
      }
    }

    await Promise.all(updates);

    return NextResponse.json({
      message: `Updated ${updates.length} league statuses`,
      updatedCount: updates.length
    });
  } catch (error) {
    console.error("League status update error:", error);
    return NextResponse.json(
      { error: "Failed to update league statuses" },
      { status: 500 }
    );
  }
}

// This can be called periodically via a cron job or manually
export async function GET() {
  return POST();
}